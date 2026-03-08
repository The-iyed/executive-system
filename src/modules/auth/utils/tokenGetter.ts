/**
 * Auth token getter used by axios. Set by AuthProvider so that when SSO is enabled
 * we use OIDC getAccessToken(), otherwise localStorage tokens.
 */

import { getTokens } from './token';

let getTokenFn: () => Promise<string | null> = async () => getTokens().access_token ?? null;

export function setAuthTokenGetter(fn: () => Promise<string | null>): void {
  getTokenFn = fn;
}

export async function getAuthToken(): Promise<string | null> {
  return getTokenFn();
}
