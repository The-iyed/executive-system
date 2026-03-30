import { APP_TIMEZONE } from '@/lib/env';

/**
 * Returns the IANA timezone to send with API requests.
 * Uses VITE_APP_TIMEZONE env variable when set, otherwise falls back to the browser timezone.
 */
export function getBrowserTimezone(): string {
  if (APP_TIMEZONE) return APP_TIMEZONE;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Call per request so the header always reflects the current browser zone. */
export function getApiTimezoneHeaders(): { 'X-Timezone': string } {
  return { 'X-Timezone': getBrowserTimezone() };
}
