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
    const user = await userManager.signinSilent();
    if (user) return user;
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

/**
 * Calls backend `POST /api/auth/refresh`, which should proxy to IdP
 * `{SSO_AUTHORITY_URL}/connect/token` with:
 * - grant_type=refresh_token
 * - refresh_token (from this request body)
 * - client_id (from body; backend may default to SSO_CLIENT_ID if omitted — we send VITE_SSO_CLIENT_ID)
 * - client_secret only on the server if configured (never in the SPA)
 * - scope optional, forwarded if present
 */
export async function refreshAccessToken(): Promise<User | null> {
  const currentUser = await userManager.getUser();
  if (!currentUser?.refresh_token) return null;

  const clientId = getEnv('VITE_SSO_CLIENT_ID', 'Outbalady.LegislationLibrary');
  const backendRefreshEndpoint = `${EXECUTION_SYSTEM_BASE_URL}/api/auth/refresh`;

  const formData = new URLSearchParams();
  formData.set('grant_type', 'refresh_token');
  formData.set('client_id', clientId);
  formData.set('refresh_token', currentUser.refresh_token);
  if (currentUser.scope) {
    formData.set('scope', currentUser.scope);
  }

  const response = await fetch(backendRefreshEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      ...getApiTimezoneHeaders(),
    },
    body: formData.toString(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend refresh failed: ${response.status} ${errorText}`);
  }

  const tokenResponse = (await response.json()) as {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    session_state?: string;
  };

  const expiresAt = tokenResponse.expires_in
    ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in
    : currentUser.expires_at;

  const profile = tokenResponse.id_token
    ? (profileFromIdToken(tokenResponse.id_token) as unknown as User['profile'])
    : currentUser.profile;

  if (!profile.sub) profile.sub = '';

  const refreshedUser = new User({
    id_token: tokenResponse.id_token ?? currentUser.id_token ?? '',
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token ?? currentUser.refresh_token,
    token_type: tokenResponse.token_type || currentUser.token_type || 'Bearer',
    scope: tokenResponse.scope ?? currentUser.scope ?? '',
    session_state: tokenResponse.session_state || currentUser.session_state || '',
    profile,
    expires_at: expiresAt,
    userState: (currentUser as unknown as { userState?: unknown }).userState ?? '',
  });

  await userManager.storeUser(refreshedUser);
  return refreshedUser;
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
        // oidc-client-ts User.expires_at is Unix seconds (not ms).
        const expiresAt = tokenResponse.expires_in
          ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in
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
          ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in
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
