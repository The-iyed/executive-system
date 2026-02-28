/**
 * Shared format helpers for dates and directive status.
 */
import { DIRECTIVE_STATUS_LABELS } from '../types';

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

/** Gregorian date in Arabic (e.g. "6 مارس 2026"). Use for all user-facing dates. */
const ARABIC_GREGORIAN_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  calendar: 'gregory',
  numberingSystem: 'latn',
};

/** Format date as Arabic normal (Gregorian) e.g. "6 مارس 2026". */
export function formatDateArabic(date: Date | string | null | undefined): string {
  if (date == null) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('ar', ARABIC_GREGORIAN_OPTIONS).format(d);
  } catch {
    return d.toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric', calendar: 'gregory' });
  }
}

/** Format date and time in Arabic (Gregorian) e.g. "6 مارس 2026، 10:30 ص". */
export function formatDateTimeArabic(date: Date | string | null | undefined): string {
  if (date == null) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const datePart = formatDateArabic(d);
  const timePart = d.toLocaleTimeString('ar', {
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory',
    numberingSystem: 'latn',
  });
  return `${datePart}، ${timePart}`;
}

/** Format date for display – Gregorian, short (e.g. "٠٦/٠٣/٢٠٢٦" or with latn "06/03/2026"). */
export function formatDateArSA(date: Date | string | null | undefined): string {
  if (date == null) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory',
    numberingSystem: 'latn',
  });
}

/** @deprecated Use formatDateArabic for display. Kept for compatibility – now returns Gregorian Arabic (e.g. "6 مارس 2026"). */
export function formatDateIslamic(dateString: string | null | undefined): string {
  return formatDateArabic(dateString);
}

/** Translate directive status to Arabic label. */
export function translateDirectiveStatus(status: string | null | undefined): string {
  if (status == null || status === '') return '—';
  return DIRECTIVE_STATUS_LABELS[String(status).toUpperCase()] ?? status;
}

export { fontStyle };
