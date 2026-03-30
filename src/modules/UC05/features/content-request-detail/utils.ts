/**
 * UC05 Content Request Detail – helper utilities.
 */
import { MeetingStatus, MeetingStatusLabels } from '@/modules/shared/types';

/** Resolve a user object to a display label. */
export function resolveUserLabel(obj: unknown, fallback?: string | null): string {
  if (obj && typeof obj === 'object') {
    const u = obj as Record<string, unknown>;
    if (u.name && typeof u.name === 'string') return u.name;
    if (u.username && typeof u.username === 'string') return u.username;
    if (u.email && typeof u.email === 'string') return u.email;
    if (u.ar_name && typeof u.ar_name === 'string') return u.ar_name;
    const first = u.first_name ?? '';
    const last = u.last_name ?? '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
  }
  if (fallback) return fallback;
  return '-';
}

/** Start of local calendar day (for date pickers). */
export function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Get display name for assignee/consultant from API response. */
export function getAssigneeDisplayName(a: {
  name?: string;
  assignee_name?: string;
  first_name?: string;
  last_name?: string;
}): string {
  if (a.name?.trim()) return a.name.trim();
  if (a.assignee_name?.trim()) return a.assignee_name.trim();
  const first = a.first_name?.trim() ?? '';
  const last = a.last_name?.trim() ?? '';
  if (first || last) return `${first} ${last}`.trim();
  return '-';
}

/** Format related_guidance which may be a string or a directive object/array. */
export function formatRelatedGuidance(value: unknown): string {
  if (typeof value === 'string') return value.trim() || '-';
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      const texts = value
        .map((d: { directive_text?: string }) => (d?.directive_text != null ? String(d.directive_text) : ''))
        .filter(Boolean);
      return texts.length > 0 ? texts.join(' ') : '-';
    }
    if ('directive_text' in value && typeof (value as { directive_text?: string }).directive_text === 'string') {
      return (value as { directive_text: string }).directive_text;
    }
  }
  return '-';
}

/** Format file size. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** Safely extract notes from string/object/array. */
export function getNotesText(...candidates: unknown[]): string {
  const extract = (value: unknown): string | null => {
    if (value == null) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (Array.isArray(value)) {
      const parts = value.map(extract).filter(Boolean) as string[];
      return parts.length ? parts.join('\n') : null;
    }
    if (typeof value === 'object') {
      const v = value as Record<string, unknown>;
      if (typeof v.text === 'string') return v.text;
      if (typeof v.note === 'string') return v.note;
      if (typeof v.content === 'string') return v.content;
      if (typeof v.value === 'string') return v.value;
      return null;
    }
    return null;
  };
  for (const candidate of candidates) {
    const text = extract(candidate);
    if (text) return text;
  }
  return '-';
}

/** Translate known compare API error detail to Arabic. */
export function translateCompareErrorDetail(detail: string | null): string | null {
  if (!detail || typeof detail !== 'string') return detail;
  const trimmed = detail.trim();
  if (trimmed.includes('Need at least two presentation attachments with completed extraction')) {
    return 'يجب وجود عرضين تقديميين على الأقل مع اكتمال استخراج المحتوى للمقارنة. تأكد من وجود العرضين في النظام واكتمال الاستخراج، أو قدّم النسخة الأصلية والنسخة الجديدة.';
  }
  return detail;
}

/** Translate comparison API enum-like values to Arabic. */
export function translateCompareValue(
  value: string | undefined | null,
  map: Record<string, string>,
): string {
  if (value == null || value === '') return '—';
  const v = String(value).toLowerCase();
  return map[v] ?? value;
}

/** Get status label with support for custom statuses. */
export function getStatusLabel(status: MeetingStatus | string): string {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  if (status === 'UNDER_CONTENT_REVIEW') {
    return 'قيد مراجعة المحتوى';
  }
  return status as string;
}

/** Normalize assignees to string[] (API may return JSON array or string). */
export function normalizeAssignees(a: unknown): string[] {
  if (Array.isArray(a)) return a.filter((x): x is string => typeof x === 'string');
  if (typeof a === 'string') {
    try {
      const parsed = JSON.parse(a) as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}
