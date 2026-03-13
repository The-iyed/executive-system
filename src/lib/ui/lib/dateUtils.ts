/**
 * Formats a Date object to YYYY-MM-DD format (ISO date string)
 * @param date - Date object to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date string (ISO or any valid date string) to YYYY-MM-DD format
 * Handles null/undefined values by returning empty string
 * @param dateString - Date string to format (can be null or undefined)
 * @returns Formatted date string in YYYY-MM-DD format, or empty string if input is invalid
 */
export const formatDateStringToISO = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return formatDateToISO(date);
  } catch {
    return '';
  }
};

/**
 * Format a Date as ISO 8601 with local timezone offset (e.g. 2026-03-31T09:00:00+03:00).
 * Use for API request payloads so the backend receives explicit timezone.
 */
export function toISOStringWithTimezone(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMin);
  const hours = Math.floor(absMin / 60);
  const minutes = absMin % 60;
  const offsetStr = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}${offsetStr}`;
}

/**
 * Convert an ISO string to ISO 8601 with local timezone offset.
 * Use when normalizing datetime strings for API requests.
 */
export function toISOStringWithTimezoneFromString(isoOrEmpty: string): string {
  if (!isoOrEmpty || typeof isoOrEmpty !== 'string') return isoOrEmpty;
  const date = new Date(isoOrEmpty);
  if (Number.isNaN(date.getTime())) return isoOrEmpty;
  return toISOStringWithTimezone(date);
}
