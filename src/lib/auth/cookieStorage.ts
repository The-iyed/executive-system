/**
 * Cookie-based storage for OIDC state (and PKCE backup).
 * Used so state persists in cookies instead of localStorage.
 */

const COOKIE_NAME = 'sanad_oidc_state';
const MAX_AGE_SEC = 900; // 15 min

function getCookieData(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  try {
    const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
    const raw = match ? decodeURIComponent(match[1]) : '';
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function setCookieData(data: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  try {
    const value = encodeURIComponent(JSON.stringify(data));
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
  } catch {
    // ignore
  }
}

export const cookieStorage: Storage = {
  getItem(key: string): string | null {
    const data = getCookieData();
    return key in data ? data[key] : null;
  },

  setItem(key: string, value: string): void {
    const data = getCookieData();
    data[key] = value;
    setCookieData(data);
  },

  removeItem(key: string): void {
    const data = getCookieData();
    delete data[key];
    setCookieData(data);
  },

  get length(): number {
    return Object.keys(getCookieData()).length;
  },

  key(index: number): string | null {
    const keys = Object.keys(getCookieData());
    return keys[index] ?? null;
  },

  clear(): void {
    setCookieData({});
  },
};
