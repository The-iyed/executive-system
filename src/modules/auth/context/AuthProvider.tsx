import { useEffect, useState, createContext, useContext, ReactNode, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../utils/axios';
import { clearTokens, getTokens, setTokens } from '../utils/token';
import { setAuthTokenGetter } from '../utils/tokenGetter';
import { useIsMountedRef } from '../hooks';
import { ScreenLoader } from '@/modules/shared';
import { User, LoginPayload, getCurrentUserApi } from '../data/authApi';
import { PATH } from '../routes/paths';
import { PostHogIdentify } from '../components/PostHogIdentify';
import { trackEvent } from '@/lib/analytics';
import { isSsoEnabled } from '@/lib/auth/ssoOrigin';
import {
  bootstrapAuth,
  initiateLogin,
  logout as oidcLogout,
  getAccessToken,
  refreshAccessToken,
} from '@/lib/auth';
import { userManager } from '@/lib/auth/oidcConfig';
import type { User as OidcUser } from 'oidc-client-ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialised: boolean;
  isLoading: boolean;
  login: (payload?: LoginPayload) => Promise<User | null>;
  logout: () => void | Promise<void>;
  setUserFromCallback: (oidcUser: OidcUser, appUser?: User | null) => void;
  refreshUser: () => Promise<void>;
  isSsoEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

interface JwtPayload {
  exp: number;
}

export const isValidToken = (token: string): boolean => {
  try {
    const decoded: JwtPayload = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
};

function oidcUserToAppUser(oidcUser: OidcUser | null): User | null {
  if (!oidcUser) return null;
  const p = oidcUser.profile as Record<string, unknown>;
  return {
    id: (oidcUser.profile.sub as string) || '',
    username: (p.preferred_username as string) || (oidcUser.profile.sub as string) || '',
    email: (p.email as string) || '',
    first_name: (p.given_name as string) || '',
    last_name: (p.family_name as string) || '',
    roles: [],
    use_cases: [],
    is_active: true,
  };
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const isMounted = useIsMountedRef();
  const [isInitialised, setIsInitialised] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const ssoEnabled = isSsoEnabled();
  const proactiveRefreshTimerRef = useRef<number | null>(null);
  const proactiveRefreshInFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    setAuthTokenGetter(
      ssoEnabled
        ? () => getAccessToken()
        : () => Promise.resolve(getTokens().access_token ?? null)
    );
  }, [ssoEnabled]);

  useEffect(() => {
    if (!isMounted.current) return;

    const errorPaths = ['/500', '/network-error'];
    if (errorPaths.includes(window.location.pathname)) {
      setUser(null);
      setIsInitialised(true);
      return;
    }

    if (ssoEnabled) {
      const currentPath = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const hasCallbackParams =
        urlParams.has('code') || urlParams.has('error') || urlParams.has('state');
      if (
        currentPath === '/callback' ||
        currentPath === '/silent-renew' ||
        hasCallbackParams
      ) {
        setIsInitialised(true);
        return;
      }
      // When SSO is enabled, /login is not a route; run same auth flow as / so we redirect to IdP (avoids freeze/redirect loop)
      // Previously we bailed out here, then router redirected /login → / but the effect never re-ran, so auth never ran on /

      const initializeAuth = async () => {
        try {
          const oidcUser = await bootstrapAuth();
          if (oidcUser) {
            try {
              const appUser = await getCurrentUserApi();
              setUser(appUser);
            } catch {
              setUser(oidcUserToAppUser(oidcUser));
            }
            setIsInitialised(true);
          } else {
            await initiateLogin();
          }
        } catch (error) {
          console.error('SSO initialization error:', error);
          try {
            await initiateLogin();
          } catch {
            setIsInitialised(true);
          }
        }
      };

      const handleUserLoaded = (loadedUser: OidcUser) => {
        getCurrentUserApi()
          .then((appUser) => setUser(appUser))
          .catch(() => setUser(oidcUserToAppUser(loadedUser)));
      };

      const handleUserUnloaded = () => {
        setUser(null);
      };

      const handleUserLoadedEvent = (loadedUser: OidcUser) => {
        handleUserLoaded(loadedUser);
        void scheduleProactiveRefresh();
      };

      const handleAccessTokenExpired = async () => {
        try {
          const renewedUser = await refreshAccessToken();
          if (renewedUser) {
            handleUserLoaded(renewedUser);
          } else {
            await initiateLogin();
          }
        } catch {
          await initiateLogin();
        }
      };

      const clearProactiveRefreshTimer = () => {
        if (proactiveRefreshTimerRef.current != null) {
          window.clearTimeout(proactiveRefreshTimerRef.current);
          proactiveRefreshTimerRef.current = null;
        }
      };

      const runProactiveRefresh = async () => {
        if (proactiveRefreshInFlightRef.current) {
          await proactiveRefreshInFlightRef.current;
          return;
        }

        proactiveRefreshInFlightRef.current = (async () => {
          try {
            const renewedUser = await refreshAccessToken();
            if (renewedUser) {
              handleUserLoaded(renewedUser);
              void scheduleProactiveRefresh();
            } else {
              await initiateLogin();
            }
          } catch {
            await initiateLogin();
          } finally {
            proactiveRefreshInFlightRef.current = null;
          }
        })();

        await proactiveRefreshInFlightRef.current;
      };

      const scheduleProactiveRefresh = async () => {
        clearProactiveRefreshTimer();
        const currentUser = await userManager.getUser();
        if (!currentUser) return;

        let expSec = currentUser.expires_at ?? null;
        // Legacy bug: expires_at was stored as ms; normalize to seconds.
        if (expSec != null && expSec > 1e12) {
          expSec = Math.floor(expSec / 1000);
        }
        if (expSec == null && currentUser.access_token) {
          try {
            expSec = jwtDecode<JwtPayload>(currentUser.access_token).exp;
          } catch {
            expSec = null;
          }
        }
        if (expSec == null) return;

        const nowMs = Date.now();
        const expiresAtMs = expSec * 1000;
        const ttlMs = expiresAtMs - nowMs;
        // Half of remaining lifetime (30m token → refresh in ~15m). Min delay avoids tight loops.
        const delayMs =
          ttlMs <= 0 ? 0 : Math.max(Math.floor(ttlMs / 2), 5_000);

        if (delayMs <= 0) {
          await runProactiveRefresh();
          return;
        }

        proactiveRefreshTimerRef.current = window.setTimeout(() => {
          void runProactiveRefresh();
        }, delayMs);
      };

      userManager.events.addUserLoaded(handleUserLoadedEvent);
      userManager.events.addUserUnloaded(handleUserUnloaded);
      userManager.events.addAccessTokenExpired(handleAccessTokenExpired);

      initializeAuth().finally(() => {
        void scheduleProactiveRefresh();
      });

      return () => {
        clearProactiveRefreshTimer();
        userManager.events.removeUserLoaded(handleUserLoadedEvent);
        userManager.events.removeUserUnloaded(handleUserUnloaded);
        userManager.events.removeAccessTokenExpired(handleAccessTokenExpired);
      };
    }

    async function fetchUser() {
      const { access_token } = getTokens();
      if (access_token) {
        try {
          const appUser = await getCurrentUserApi();
          setUser(appUser);
          setIsInitialised(true);
        } catch {
          setUser(null);
          clearTokens();
          setIsInitialised(true);
        }
      } else {
        setUser(null);
        clearTokens();
        setIsInitialised(true);
      }
    }

    fetchUser();
  }, [isMounted, ssoEnabled]);

  const login = async (payload?: LoginPayload): Promise<User | null> => {
    if (ssoEnabled) {
      setIsLoading(true);
      try {
        await initiateLogin();
        return null;
      } finally {
        setIsLoading(false);
      }
    }
    if (!payload) return null;
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/login', payload);
      const { access_token } = response.data;
      setTokens(access_token);
      const userData = await getCurrentUserApi();
      setUser(userData);
      trackEvent('auth', 'auth_login_success', { user_id: userData.id });
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (ssoEnabled) {
      trackEvent('auth', 'auth_logout');
      try {
        await oidcLogout();
      } catch (error) {
        console.error('SSO logout error:', error);
        setUser(null);
      }
      return;
    }
    trackEvent('auth', 'auth_logout');
    clearTokens();
    setUser(null);
  };

  const setUserFromCallback = (oidcUser: OidcUser, appUser?: User | null): void => {
    if (appUser != null) {
      setUser(appUser);
    } else {
      setUser(oidcUserToAppUser(oidcUser));
    }
    setIsInitialised(true);
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const appUser = await getCurrentUserApi();
      setUser(appUser);
    } catch {
      setUser(null);
    }
  };

  if (!isInitialised || isLoading) {
    return <ScreenLoader />;
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isInitialised,
    isLoading,
    login,
    logout,
    setUserFromCallback,
    refreshUser,
    isSsoEnabled: ssoEnabled,
  };

  return (
    <AuthContext.Provider value={value}>
      <PostHogIdentify />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
