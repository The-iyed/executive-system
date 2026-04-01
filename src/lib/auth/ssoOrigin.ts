/**
 * SSO enable/disable from env.
 * When VITE_SSO_ENABLED is truthy (see below), SSO (OIDC) is used; otherwise email/password auth only.
 *
 * Accepts common .env variants so production does not silently fall back to /login flows.
 */
export function isSsoEnabled(): boolean {
  const raw = (import.meta.env as Record<string, string | undefined>).VITE_SSO_ENABLED;
  if (raw == null || raw === '') return false;
  const v = String(raw).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}
