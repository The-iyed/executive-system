/**
 * Shared format helpers for dates and directive status.
 */
import { DIRECTIVE_STATUS_LABELS } from '../types';

const fontStyle = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" } as const;

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
    hour12: false,
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

/** Format a date as relative time in Arabic (e.g. "منذ دقيقة", "منذ 3 ساعات", "منذ يومين"). */
export function formatTimeAgoArabic(date: Date | string | null | undefined): string {
  if (date == null) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 30) return 'الآن';
  if (diffSec < 60) return 'منذ لحظات';
  if (diffMin === 1) return 'منذ دقيقة';
  if (diffMin === 2) return 'منذ دقيقتين';
  if (diffMin >= 3 && diffMin <= 10) return `منذ ${diffMin} دقائق`;
  if (diffMin >= 11 && diffMin <= 20) return `منذ ${diffMin} دقيقة`;
  if (diffMin >= 21 && diffMin <= 30) return `منذ نصف ساعة`;
  if (diffMin >= 31 && diffMin <= 45) return `منذ ${diffMin} دقيقة`;
  if (diffMin >= 46 && diffMin <= 59) return `منذ ساعة تقريباً`;
  if (diffHr === 1) return 'منذ ساعة';
  if (diffHr === 2) return 'منذ ساعتين';
  if (diffHr >= 3 && diffHr <= 10) return `منذ ${diffHr} ساعات`;
  if (diffHr >= 11 && diffHr < 24) return `منذ ${diffHr} ساعة`;
  if (diffDay === 1) return 'منذ يوم';
  if (diffDay === 2) return 'منذ يومين';
  if (diffDay <= 10) return `منذ ${diffDay} أيام`;
  if (diffDay < 30) return `منذ ${diffDay} يوم`;
  if (diffWeek <= 4) {
    if (diffWeek === 1) return 'منذ أسبوع';
    if (diffWeek === 2) return 'منذ أسبوعين';
    return `منذ ${diffWeek} أسابيع`;
  }
  if (diffMonth === 1) return 'منذ شهر';
  if (diffMonth === 2) return 'منذ شهرين';
  if (diffMonth <= 10) return `منذ ${diffMonth} أشهر`;
  if (diffMonth < 12) return `منذ ${diffMonth} شهر`;
  // Fallback to full date for very old dates
  return formatDateTimeArabic(d);
}

export { fontStyle };
