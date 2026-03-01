/**
 * Pure helpers for meeting detail (mapping, normalization, validation, format).
 */
import type { GeneralNoteItem, MinisterAttendee } from '@shared/types';

export type AttendanceChannel = 'PHYSICAL' | 'REMOTE';

/** Map API attendance_mechanism (Arabic) to attendance_channel enum */
export function mapAttendanceMechanismToChannel(
  v: string | null | undefined
): AttendanceChannel {
  if (!v || typeof v !== 'string') return 'PHYSICAL';
  const s = v.trim().toLowerCase();
  if (s === 'عن بعد' || s === 'remote' || s === 'remot') return 'REMOTE';
  return 'PHYSICAL';
}

/** Map API minister_attendees (mobile, attendance_mechanism) to form format (phone, attendance_channel) */
export function mapApiMinisterAttendeesToForm(
  list: (MinisterAttendee & { mobile?: string; attendance_mechanism?: string })[] | undefined
): MinisterAttendee[] {
  return (list || []).map((a) => ({
    ...a,
    phone: a.mobile ?? (a as MinisterAttendee & { mobile?: string }).phone ?? '',
    attendance_channel: (a.attendance_channel ??
      mapAttendanceMechanismToChannel(a.attendance_mechanism)) as AttendanceChannel,
  }));
}

export interface NormalizedMinisterAttendee {
  username: string;
  external_name: string;
  external_email: string;
  is_required: boolean;
  justification: string;
  access_permission: string;
  position: string;
  phone: string;
  attendance_channel: AttendanceChannel;
  is_consultant: boolean;
}

/** Normalize minister attendees so all API-required fields are present (no undefined). */
export function normalizeMinisterAttendees(
  list: MinisterAttendee[] | undefined
): NormalizedMinisterAttendee[] {
  return (list || []).map((a) => ({
    username: a.username ?? '',
    external_name: a.external_name ?? '',
    external_email: a.external_email ?? '',
    is_required: a.is_required ?? false,
    justification: a.justification ?? '',
    access_permission: a.access_permission ?? 'FULL',
    position: a.position ?? '',
    phone: a.mobile ?? (a as MinisterAttendee & { phone?: string }).phone ?? '',
    attendance_channel: (a.attendance_channel ?? 'PHYSICAL') as AttendanceChannel,
    is_consultant: a.is_consultant ?? false,
  }));
}

/** Simple email format validation */
export function isValidEmail(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}

/** Translate comparison API enum-like values to Arabic */
export function translateCompareValue(
  value: string | undefined | null,
  map: Record<string, string>
): string {
  if (value == null || value === '') return '—';
  return map[String(value).toLowerCase()] ?? value;
}

/** Normalize API general_notes (array of items or legacy string) to a list for display */
export function getGeneralNotesList(
  generalNotes: GeneralNoteItem[] | string | null | undefined
): GeneralNoteItem[] {
  if (generalNotes == null) return [];
  if (Array.isArray(generalNotes)) return generalNotes;
  if (typeof generalNotes === 'string' && generalNotes.trim() !== '') {
    return [
      {
        id: '',
        note_type: 'GENERAL',
        text: generalNotes,
        author_id: '',
        author_type: '',
        author_name: null,
        created_at: '',
        updated_at: '',
      },
    ];
  }
  return [];
}

/** Directive status labels for التوجيهات المرتبطة list */
export const DIRECTIVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  IN_PROGRESS: 'قيد التنفيذ',
  CURRENT: 'جاري',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  CLOSED: 'مغلق',
  OPEN: 'مفتوح',
};

export function translateDirectiveStatus(status: string | undefined | null): string {
  if (status == null || status === '') return '—';
  return DIRECTIVE_STATUS_LABELS[String(status).toUpperCase()] ?? status;
}

/** Format a time slot for display (slot_start, slot_end). */
export function formatSlot(slot: {
  id?: string;
  slot_start?: string;
  slot_end?: string | null;
  is_selected?: boolean;
} | null): { id: string; time: string; selected: boolean } | null {
  if (!slot || !slot.slot_start) return null;
  const start = new Date(slot.slot_start);
  const end = slot.slot_end ? new Date(slot.slot_end) : null;
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const timeStr = end
    ? `${fmt(start)} - ${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
    : fmt(start);
  return {
    id: slot.id ?? '',
    time: timeStr,
    selected: !!slot.is_selected,
  };
}
