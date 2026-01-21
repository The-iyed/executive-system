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
