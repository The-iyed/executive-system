import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { cookieStorage } from './cookieStorage';
import { EXECUTION_SYSTEM_BASE_URL } from '@/lib/env';

/** Backup key prefix for code_verifier so we can read it after the library removes the oidc.* entry. */
export const PKCE_BACKUP_PREFIX = 'sanad_pkce_';

export function clearPkceBackup(stateId: string | null): void {
  if (!stateId || typeof window === 'undefined') return;
  try {
    const backupKey = PKCE_BACKUP_PREFIX + stateId;
    cookieStorage.removeItem(backupKey);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(backupKey);
    }
  } catch {
    // ignore
  }
}

function createStateStoreWithPkceBackup(): import('oidc-client-ts').StateStore {
  const store = typeof window !== 'undefined' ? cookieStorage : (undefined as unknown as Storage);
  const base = new WebStorageStateStore({ store });
  return {
    async set(key: string, value: string): Promise<void> {
      await base.set(key, value);
      try {
        const obj = JSON.parse(value) as { code_verifier?: string };
        if (obj?.code_verifier) {
          const backupKey = PKCE_BACKUP_PREFIX + key;
          store.setItem(backupKey, obj.code_verifier);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(backupKey, obj.code_verifier);
          }
        }
      } catch {
        // ignore
      }
    },
    async get(key: string): Promise<string | null> {
      return base.get(key);
    },
    async remove(key: string): Promise<string | null> {
      const value = await base.get(key);
      return value;
    },
    async getAllKeys(): Promise<string[]> {
      return base.getAllKeys();
    },
  };
}

const getEnv = (key: string, fallback: string): string =>
  (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string | undefined>)?.[key]) || fallback;

const SSO_AUTHORITY = getEnv('VITE_SSO_AUTHORITY_URL', 'https://ssoappdev.momra.gov.sa');
const SSO_CLIENT_ID = getEnv('VITE_SSO_CLIENT_ID', 'Outbalady.LegislationLibrary');

export function getRedirectUri(): string {
  const envUri = getEnv('VITE_REDIRECT_URI', '');
  if (envUri) {
    return envUri.trim();
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const path = (window.location.pathname || '/').replace(/\/+$/, '') || '';
    const full = path ? `${origin}${path}` : origin;
    return full.replace(/\/+$/, '') || origin;
  }
  return '';
}

/**
 * Redirect URI for OIDC silent renew (iframe). Must differ from the interactive callback
 * when the latter is the site root, and must match an allowed redirect URI on the IdP client.
 */
export function getSilentRedirectUri(): string {
  const envUri = getEnv('VITE_SILENT_REDIRECT_URI', '');
  if (envUri) {
    return envUri.trim();
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/silent-renew`;
  }
  return '';
}

const BACKEND_API_URL = EXECUTION_SYSTEM_BASE_URL || '';

const metadata = {
  issuer: SSO_AUTHORITY,
  authorization_endpoint: `${SSO_AUTHORITY}/connect/authorize`,
  token_endpoint: `${BACKEND_API_URL}/api/auth/token-exchange`,
  userinfo_endpoint: `${SSO_AUTHORITY}/connect/userinfo`,
  end_session_endpoint: `${SSO_AUTHORITY}/connect/endsession`,
  jwks_uri: `${SSO_AUTHORITY}/.well-known/openid-configuration/jwks`,
  check_session_iframe: `${SSO_AUTHORITY}/connect/checksession`,
  revocation_endpoint: `${SSO_AUTHORITY}/connect/revocation`,
  introspection_endpoint: `${SSO_AUTHORITY}/connect/introspect`,
  device_authorization_endpoint: `${SSO_AUTHORITY}/connect/deviceauthorization`,
  backchannel_authentication_endpoint: `${SSO_AUTHORITY}/connect/ciba`,
};

const oidcConfig = {
  authority: SSO_AUTHORITY,
  client_id: SSO_CLIENT_ID,
  get redirect_uri() {
    return getRedirectUri();
  },
  get silent_redirect_uri() {
    return getSilentRedirectUri();
  },
  get post_logout_redirect_uri() {
    return getRedirectUri();
  },
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  loadUserInfo: false,
  filterProtocolClaims: true,
  silentRequestTimeout: 1000,
  revokeAccessTokenOnSignout: true,
  stateStore: createStateStoreWithPkceBackup(),
  metadata,
};

export const userManager = new UserManager(oidcConfig);
