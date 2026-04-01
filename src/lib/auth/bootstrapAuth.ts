import { jwtDecode } from 'jwt-decode';
import {
  userManager,
  PKCE_BACKUP_PREFIX,
  clearPkceBackup,
  getRedirectUri,
  getSilentRedirectUri,
} from './oidcConfig';
import { cookieStorage } from './cookieStorage';
import { User } from 'oidc-client-ts';
import { EXECUTION_SYSTEM_BASE_URL } from '@/lib/env';
import { getApiTimezoneHeaders } from '@/lib/api/apiTimezone';

/** App user shape returned by GET /api/auth/me (matches backend). */
export interface AppUserFromMe {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles?: Array<{ code: string; name: string }>;
  use_cases?: string[];
  is_active: boolean;
}

/** Result of handleCallback: OIDC user and optional app user from GET /me. */
export interface CallbackResult {
  oidcUser: User;
  appUser: AppUserFromMe | null;
}

function profileFromIdToken(idToken: string | undefined): Record<string, unknown> {
  if (!idToken || typeof idToken !== 'string') return {};
  try {
    const payload = jwtDecode<Record<string, unknown>>(idToken);
    return payload && typeof payload === 'object' ? payload : {};
  } catch {
    return {};
  }
}

/**
 * Bootstrap authentication on every load/refresh.
 * 1. Check OIDC (userManager.getUser()) first.
 * 2. Otherwise trigger SSO (initiateLogin).
 */
export async function bootstrapAuth(): Promise<User | null> {
  try {
    const existingUser = await userManager.getUser();
    if (existingUser && !existingUser.expired) {
      return existingUser;
    }
    if (existingUser?.refresh_token) {
      try {
        const user = await userManager.signinSilent();
        if (user) return user;
      } catch {
        // refresh token expired or backend doesn't support it — fall through
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function initiateLogin(): Promise<void> {
  try {
    await userManager.signinRedirect();
  } catch (error) {
    console.error('Error initiating login:', error);
    throw error;
  }
}

const PRE_AUTH_PATH_KEY = 'sanad_pre_auth_path';

export function saveCurrentPath(): void {
  try {
    const path = window.location.pathname + window.location.search;
    if (path && path !== '/' && !path.startsWith('/callback') && !path.startsWith('/silent-renew')) {
      sessionStorage.setItem(PRE_AUTH_PATH_KEY, path);
    }
  } catch { /* ignore */ }
}

export function consumeSavedPath(): string | null {
  try {
    const path = sessionStorage.getItem(PRE_AUTH_PATH_KEY);
    sessionStorage.removeItem(PRE_AUTH_PATH_KEY);
    return path;
  } catch {
    return null;
  }
}

/**
 * Renew token without iframe. Strategy:
 * 1. If user has a refresh_token → signinSilent uses token endpoint (HTTP only, no iframe).
 * 2. If no refresh_token or signinSilent fails → full redirect to IdP.
 *    SSO session is still alive so IdP returns immediately with a new code (no login form).
 */
let renewPromise: Promise<User | null> | null = null;

export async function renewToken(): Promise<User | null> {
  if (renewPromise) return renewPromise;

  renewPromise = (async () => {
    const existing = await userManager.getUser();
    if (existing?.refresh_token) {
      try {
        const renewed = await userManager.signinSilent();
        return renewed;
      } catch (e) {
        console.warn('[Auth] Refresh token renewal failed, falling back to redirect:', e);
      }
    }
    saveCurrentPath();
    await userManager.signinRedirect();
    return null;
  })().finally(() => {
    renewPromise = null;
  });

  return renewPromise;
}

export function getStoredCodeVerifier(state: string | null): string | undefined {
  if (!state || typeof window === 'undefined') return undefined;
  const fromBackup = (): string | undefined => {
    try {
      const v =
        cookieStorage.getItem(PKCE_BACKUP_PREFIX + state) ??
        localStorage.getItem(PKCE_BACKUP_PREFIX + state) ??
        sessionStorage.getItem(PKCE_BACKUP_PREFIX + state);
      return v ?? undefined;
    } catch {
      return undefined;
    }
  };
  const backup = fromBackup();
  if (backup) return backup;
  const tryStore = (store: Storage) => {
    try {
      const direct = store.getItem('oidc.' + state);
      if (direct) {
        const obj = JSON.parse(direct) as { id?: string; code_verifier?: string };
        if (obj?.id === state && obj?.code_verifier) return obj.code_verifier;
      }
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (!k?.startsWith('oidc.')) continue;
        try {
          const v = store.getItem(k);
          if (!v) continue;
          const obj = JSON.parse(v) as { id?: string; state?: string; code_verifier?: string };
          const matches = (obj?.id === state || obj?.state === state) && !!obj?.code_verifier;
          if (matches) return obj.code_verifier;
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    return undefined;
  };
  return tryStore(cookieStorage) ?? tryStore(localStorage) ?? tryStore(sessionStorage);
}

const getEnv = (key: string, fallback: string): string =>
  (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string | undefined>)?.[key]) || fallback;

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  options?: { state?: string; code_verifier?: string }
): Promise<{
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  session_state?: string;
}> {
  const clientId = getEnv('VITE_SSO_CLIENT_ID', 'Outbalady.LegislationLibrary');
  const backendProxyEndpoint = `${EXECUTION_SYSTEM_BASE_URL}/api/auth/token-exchange`;

  const formData = new URLSearchParams();
  formData.set('grant_type', 'authorization_code');
  formData.set('client_id', clientId);
  formData.set('redirect_uri', redirectUri);
  formData.set('code', code);
  if (options?.code_verifier) formData.set('code_verifier', options.code_verifier);
  if (options?.state) formData.set('state', options.state);

  const response = await fetch(backendProxyEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      ...getApiTimezoneHeaders(),
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Backend token exchange failed: ${response.status} ${errorText}. Ensure your backend implements ${backendProxyEndpoint}.`
    );
  }

  return await response.json();
}

export async function handleCallback(): Promise<CallbackResult | null> {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    const stateFromUrl = urlParams.get('state');
    const codeVerifierFromStorage = getStoredCodeVerifier(stateFromUrl);

    const doCustomExchange = (): Promise<CallbackResult | null> => {
      if (!codeFromUrl) throw new Error('No authorization code in callback URL');
      const redirectUri = getRedirectUri();
      return exchangeCodeForToken(codeFromUrl, redirectUri, {
        state: stateFromUrl ?? undefined,
        code_verifier: codeVerifierFromStorage,
      }).then(async (tokenResponse) => {
        const expiresAt = tokenResponse.expires_in
          ? Date.now() + tokenResponse.expires_in * 1000
          : undefined;
        const profile = profileFromIdToken(tokenResponse.id_token) as unknown as User['profile'];
        if (!profile.sub) profile.sub = '';
        const user = new User({
          id_token: tokenResponse.id_token ?? '',
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          token_type: tokenResponse.token_type || 'Bearer',
          scope: tokenResponse.scope ?? '',
          session_state: tokenResponse.session_state || '',
          profile,
          expires_at: expiresAt,
          userState: stateFromUrl || '',
        });
        await userManager.storeUser(user);
        clearPkceBackup(stateFromUrl);
        return { oidcUser: user, appUser: null };
      });
    };

    if (codeFromUrl && codeVerifierFromStorage) {
      try {
        return await doCustomExchange();
      } catch (err) {
        console.warn('[Auth] Custom exchange with code_verifier failed, trying library...', err);
      }
    }

    try {
      const user = await userManager.signinRedirectCallback();
      return { oidcUser: user, appUser: null };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('code_verifier') || msg.includes('400') || msg.includes('No matching state')) {
        return doCustomExchange();
      }
      throw error;
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    return null;
  }
}

export async function handleSilentRenew(): Promise<void> {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    const stateFromUrl = urlParams.get('state');
    const codeVerifierFromStorage = getStoredCodeVerifier(stateFromUrl);

    try {
      await userManager.signinSilentCallback();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('code_verifier') || msg.includes('400')) {
        if (!codeFromUrl) return;
        const redirectUri = getSilentRedirectUri();
        const tokenResponse = await exchangeCodeForToken(codeFromUrl, redirectUri, {
          state: stateFromUrl ?? undefined,
          code_verifier: codeVerifierFromStorage,
        });
        const expiresAt = tokenResponse.expires_in
          ? Date.now() + tokenResponse.expires_in * 1000
          : undefined;
        const profile = profileFromIdToken(tokenResponse.id_token) as unknown as User['profile'];
        if (!profile.sub) profile.sub = '';
        const user = new User({
          id_token: tokenResponse.id_token ?? '',
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          token_type: tokenResponse.token_type || 'Bearer',
          scope: tokenResponse.scope ?? '',
          session_state: tokenResponse.session_state || '',
          profile,
          expires_at: expiresAt,
          userState: stateFromUrl || '',
        });
        await userManager.storeUser(user);
        clearPkceBackup(stateFromUrl);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error handling silent renew:', error);
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const user = await userManager.getUser();
    return user?.access_token || null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    localStorage.removeItem('user');
    await userManager.signoutRedirect();
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}
