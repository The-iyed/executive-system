/**
 * Mappers to produce RequestNotesViewData from raw API responses.
 */
import { MeetingStatus } from '@/modules/shared/types';
import type { RequestNotesViewData } from './types';

/**
 * Normalize API note fields to display text.
 * Handles: null, string, array of strings, array of { text } objects.
 */
export function normalizeNotesFromApi(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (!Array.isArray(value)) return '';
  const parts = value
    .map((n: unknown) => {
      if (n == null) return '';
      if (typeof n === 'string') return n.trim();
      if (typeof n === 'object' && n !== null && 'text' in n && typeof (n as { text?: string }).text === 'string') {
        return (n as { text: string }).text.trim();
      }
      return '';
    })
    .filter(Boolean);
  return parts.join('\n');
}

/** Raw meeting shape expected by the mapper */
export interface RawMeetingForNotes {
  status?: string | null;
  content_officer_notes?: unknown;
  scheduling_officer_note?: unknown;
  general_notes?: unknown;
  rejection_reason?: string | null;
  rejection_note?: string | null;
  cancellation_reason?: string | null;
  cancellation_note?: string | null;
}

const str = (v: unknown) => (v != null && typeof v === 'string' ? v.trim() : '');

/** Map a raw meeting to RequestNotesViewData */
export function mapMeetingToRequestNotes(meeting: RawMeetingForNotes | undefined | null): RequestNotesViewData {
  if (!meeting) return { notes: [] };

  const status = meeting.status as MeetingStatus;
  const isRejected = status === MeetingStatus.REJECTED;
  const isCancelled = status === MeetingStatus.CANCELLED;

  const refusalReason = isRejected ? str(meeting.rejection_reason) || str(meeting.cancellation_reason) : '';
  const refusalExtra = isRejected ? str(meeting.rejection_note) || str(meeting.cancellation_note) : '';
  const cancelReason = isCancelled ? str(meeting.cancellation_reason) || str(meeting.rejection_reason) : '';
  const cancelExtra = isCancelled ? str(meeting.cancellation_note) || str(meeting.rejection_note) : '';

  const contentOfficerNotes = normalizeNotesFromApi(meeting.content_officer_notes);
  const schedulingOfficerNote = normalizeNotesFromApi(meeting.scheduling_officer_note);
  const generalNotesText = normalizeNotesFromApi(meeting.general_notes);

  const notes: RequestNotesViewData['notes'] = [];

  if (isRejected && refusalReason) {
    notes.push({ key: 'refusal-reason', title: 'سبب الرفض', text: refusalReason, variant: 'refusal' });
  }
  if (isRejected && refusalExtra) {
    notes.push({ key: 'refusal-extra', title: 'ملاحظات إضافية (الرفض)', text: refusalExtra, variant: 'general' });
  }
  if (isCancelled && cancelReason) {
    notes.push({ key: 'cancel-reason', title: 'سبب الإلغاء', text: cancelReason, variant: 'cancellation' });
  }
  if (isCancelled && cancelExtra) {
    notes.push({ key: 'cancel-extra', title: 'ملاحظات إضافية (الإلغاء)', text: cancelExtra, variant: 'general' });
  }
  if (contentOfficerNotes) {
    notes.push({ key: 'content', title: 'ملاحظات مسؤول المحتوى', text: contentOfficerNotes, variant: 'content' });
  }
  if (schedulingOfficerNote) {
    notes.push({ key: 'scheduling', title: 'ملاحظات مسؤول الجدولة', text: schedulingOfficerNote, variant: 'scheduling' });
  }
  if (generalNotesText) {
    notes.push({ key: 'general', title: 'ملاحظات إضافية', text: generalNotesText, variant: 'general' });
  }

  return { notes };
}

/** Map a content request's scheduling note to RequestNotesViewData (UC05) */
export function mapContentRequestToRequestNotes(schedulingContentNote: string | null | undefined): RequestNotesViewData {
  const text = schedulingContentNote?.trim() || '';
  if (!text) return { notes: [] };
  return {
    notes: [
      { key: 'scheduling-content', title: 'ملاحظات مسؤول الجدولة على المحتوى', text, variant: 'scheduling' },
    ],
  };
}
