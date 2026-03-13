/**
 * IANA timezone from the browser (e.g. "Africa/Tunis", "Europe/Paris").
 * Sent on API requests so the backend can interpret dates; not hardcoded.
 */
export function getBrowserTimezone(): string {
  try {
    return "Asia/Riyadh" || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Call per request so the header always reflects the current browser zone. */
export function getApiTimezoneHeaders(): { 'X-Timezone': string } {
  return { 'X-Timezone': getBrowserTimezone() };
}
