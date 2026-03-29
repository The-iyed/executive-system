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

function getTimezoneOffsetString(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

/**
 * Formats a Date to local ISO 8601 with timezone offset (e.g. 2026-04-01T05:00:00+03:00).
 * Ensures the exact user-selected time is sent to the API without UTC conversion.
 */
export function toISOStringWithTimezone(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${getTimezoneOffsetString(date)}`;
}

/**
 * Normalize a date string to local ISO 8601 with timezone offset for API payloads.
 */
export function toISOStringWithTimezoneFromString(isoOrEmpty: string): string {
  if (!isoOrEmpty || typeof isoOrEmpty !== 'string') return isoOrEmpty;
  const date = new Date(isoOrEmpty);
  if (Number.isNaN(date.getTime())) return isoOrEmpty;
  return toISOStringWithTimezone(date);
}
