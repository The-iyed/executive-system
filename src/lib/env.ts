/**
 * Centralized env-based URLs. Use these instead of hardcoding base URLs.
 * Fallbacks match .env.example defaults for local/dev without .env.
 */

const getEnv = (key: string, fallback: string): string =>
  (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string | undefined>)?.[key]) || fallback;

/** Execution system (meetings, auth, presentations). */
export const EXECUTION_SYSTEM_BASE_URL = getEnv(
  'VITE_APP_BASE_URL_MINISTER',
  'https://execution-system.momrahai.com'
);

/** Business cards / Adam meetings API base (includes /api/v1). */
export const BUSINESS_CARDS_BASE_URL = getEnv(
  'VITE_BUSINESS_CARDS_BASE_URL',
  'https://momah-business-cards.momrahai.com/api/v1'
);

/** Business cards origin only (no path), when needed. */
export const BUSINESS_CARDS_ORIGIN = getEnv(
  'VITE_BUSINESS_CARDS_BASE_URL',
  'https://momah-business-cards.momrahai.com/api/v1'
).replace(/\/api\/v1\/?$/, '') || 'https://momah-business-cards.momrahai.com';

/** Unified platform remote (UC-09, UC-13). No trailing slash so /assets/remoteEntry.js concatenates correctly. */
export const UEP_REMOTE_URL = (getEnv(
  'VITE_UEP_REMOTE_URL',
  'https://admin-unified-patform-dev-2.momrahai.com'
) || '').replace(/\/+$/, '');

/** Text contradiction detector base (no trailing path). */
export const TEXT_CONTRADICTION_DETECTOR_URL = getEnv(
  'VITE_TEXT_CONTRADICTION_DETECTOR_URL',
  'https://text-contradiction-detector.momrahai.com'
);

/** Meeting attendee suggestions API base. */
export const INVITEE_SUGGESTIONS_URL = getEnv(
  'VITE_INVITEE_SUGGESTIONS_URL',
  'https://invitee.builtop.com'
);

/** Model logos base (for provider icons). */
export const MODELS_LOGO_BASE_URL = getEnv(
  'VITE_MODELS_LOGO_BASE_URL',
  'https://models.dev'
);

/** SSO enabled (OIDC); when "true", login uses IdP redirect. */
export const SSO_ENABLED = getEnv('VITE_SSO_ENABLED', '') === 'true';

/** SSO authority URL (IdP). */
export const SSO_AUTHORITY_URL = getEnv(
  'VITE_SSO_AUTHORITY_URL',
  'https://ssoappdev.momra.gov.sa'
);

/** App timezone override (IANA, e.g. "Asia/Riyadh"). Empty = use browser. */
export const APP_TIMEZONE = getEnv('VITE_APP_TIMEZONE', '');

/** SSO client id. */
export const SSO_CLIENT_ID = getEnv(
  'VITE_SSO_CLIENT_ID',
  'Outbalady.LegislationLibrary'
);
