import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../utils/axios';
import { clearTokens, getTokens, setTokens } from '../utils/token';
import { useIsMountedRef } from '../hooks';
import { ScreenLoader } from '@/modules/shared';
import { User, LoginPayload } from '../data/authApi';
import { PATH } from '../routes/paths';
import { PostHogIdentify } from '../components/PostHogIdentify';
import { trackEvent } from '@analytics';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialised: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
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

const AuthProvider = ({ children }: AuthProviderProps) => {
  const isMounted = useIsMountedRef();
  const [isInitialised, setIsInitialised] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isMounted.current) {
      return;
    }

    const errorPaths = ['/500', '/network-error'];
    if (errorPaths.includes(window.location.pathname)) {
      setUser(null);
      setIsInitialised(true);
      return;
    }

    async function fetchUser() {
      const { refresh_token } = getTokens();
      if (refresh_token 
        // && isValidToken(refresh_token)
      ) {
        try {
          const response = await axiosInstance.get('/api/auth/me');
          const user = response.data?.data || response.data?.payload || response.data;
          setUser(user);
          setIsInitialised(true);
        } catch (error) {
          // Error is handled by axios interceptor (redirect)
          // But we must finish initialisation here to stop the loader
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/login', payload);
      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);
      
      // Fetch user after login
      const userResponse = await axiosInstance.get('/api/auth/me');
      const userData = userResponse.data?.data || userResponse.data?.payload || userResponse.data;
      setUser(userData);
      trackEvent('auth', 'auth_login_success', { user_id: userData.id });
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    trackEvent('auth', 'auth_logout');
    clearTokens();
    setUser(null);
    // Navigate to login page using absolute URL to avoid base tag issues
    window.location.href = window.location.origin + PATH.LOGIN;
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