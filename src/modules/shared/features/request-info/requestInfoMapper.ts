/**
 * Maps raw meeting API response to RequestInfoData for the shared RequestInfo component.
 * Resolves user objects (submitter, meeting_owner) with priority:
 * name → username → email → ar_name → first_name + last_name → '—'
 */
import type { RequestInfoData } from './types';

/** Resolve a user object to a display label with field priority */
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
  return '—';
}

/** Shape of the raw meeting data expected by the mapper */
export interface RawMeetingForRequestInfo {
  request_number?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
  status?: string | null;
  submitter?: unknown;
  submitter_name?: string | null;
  meeting_owner?: unknown;
  meeting_owner_name?: string | null;
}

/** Map raw meeting API response to RequestInfoData */
export function mapMeetingToRequestInfo(meeting: RawMeetingForRequestInfo | undefined | null): RequestInfoData {
  if (!meeting) {
    return {
      request_number: '—',
      request_date: '',
      request_status: '',
      submitter_name: '—',
      meeting_owner_name: '—',
    };
  }

  return {
    request_number: meeting.request_number ?? '—',
    request_date: meeting.submitted_at ?? meeting.created_at ?? '',
    request_status: meeting.status ?? '',
    submitter_name: resolveUserLabel(meeting.submitter, meeting.submitter_name),
    meeting_owner_name: resolveUserLabel(meeting.meeting_owner, meeting.meeting_owner_name),
  };
}
