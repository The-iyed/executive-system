/**
 * Shared format helpers for dates and directive status.
 */
import { DIRECTIVE_STATUS_LABELS } from '../types';

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

/** Format date for display (ar-SA). */
export function formatDateArSA(date: Date | string | null | undefined): string {
  if (date == null) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/** Format date to Arabic with Islamic calendar (e.g. "الاثنين، 23 شعبان 1447 هـ"). */
export function formatDateIslamic(dateString: string | null | undefined): string {
  if (dateString == null || dateString === '') return '';
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'islamic',
      numberingSystem: 'arab',
    };
    return new Intl.DateTimeFormat('ar-SA', options).format(date);
  } catch {
    try {
      return new Date(dateString).toLocaleDateString('ar-SA');
    } catch {
      return dateString;
    }
  }
}

/** Translate directive status to Arabic label. */
export function translateDirectiveStatus(status: string | null | undefined): string {
  if (status == null || status === '') return '—';
  return DIRECTIVE_STATUS_LABELS[String(status).toUpperCase()] ?? status;
}

export { fontStyle };
