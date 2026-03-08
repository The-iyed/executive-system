/**
 * SSO enable/disable from env.
 * When VITE_SSO_ENABLED is "true", SSO (OIDC) is used; otherwise basic email/password auth only.
 */

export function isSsoEnabled(): boolean {
  return (import.meta.env as Record<string, string | undefined>).VITE_SSO_ENABLED === 'true';
}
