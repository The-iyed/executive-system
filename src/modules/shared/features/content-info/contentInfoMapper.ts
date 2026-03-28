/**
 * Maps raw meeting API data → ContentInfoViewData for the shared ContentInfoView.
 */
import type { ContentInfoViewData, ContentInfoSection, ContentFileItem } from './types';

export interface RawAttachment {
  id: string;
  file_name: string;
  file_size?: number | null;
  file_type?: string | null;
  blob_url?: string | null;
  is_presentation?: boolean;
  is_additional?: boolean;
  is_executive_summary?: boolean;
  presentation_sequence?: number | null;
}

export interface RawMeetingForContent {
  attachments?: RawAttachment[] | null;
  previous_meeting_attachment?: { id?: string } | null;
  executive_summary?: string | null;
  general_notes?: unknown;
  content_officer_notes?: unknown;
}

function toFileItem(att: RawAttachment): ContentFileItem {
  return {
    id: att.id,
    file_name: att.file_name,
    file_size: att.file_size ?? 0,
    file_type: att.file_type ?? '',
    blob_url: att.blob_url ?? null,
    sequence: att.presentation_sequence ?? undefined,
    badge: att.presentation_sequence && att.presentation_sequence > 0
      ? `نسخة ${att.presentation_sequence}`
      : null,
  };
}

function parseNotes(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (Array.isArray(raw)) {
    const joined = raw
      .map((n: { text?: string }) => (n?.text ?? '').trim())
      .filter(Boolean)
      .join('\n\n');
    return joined || null;
  }
  if (typeof raw === 'object' && 'text' in raw) {
    const t = ((raw as { text?: string }).text ?? '').trim();
    return t || null;
  }
  return null;
}

export interface MapContentInfoOptions {
  /** Hide sections with no data. Default: true */
  hideEmpty?: boolean;
}

export function mapMeetingToContentInfo(
  meeting: RawMeetingForContent,
  options?: MapContentInfoOptions,
): ContentInfoViewData {
  const hideEmpty = options?.hideEmpty ?? true;
  const attachments = meeting.attachments ?? [];
  const prevId = meeting.previous_meeting_attachment?.id ?? null;

  const presentationFiles = attachments
    .filter((a) => a.is_presentation)
    .map(toFileItem);

  const optionalFiles = attachments
    .filter((a) => a.is_additional && !a.is_presentation && !a.is_executive_summary && (prevId == null || a.id !== prevId))
    .map(toFileItem);

  const execSummaryAtts = attachments
    .filter((a) => a.is_executive_summary)
    .map(toFileItem);

  const execSummaryText = meeting.executive_summary != null
    ? String(meeting.executive_summary).trim() || null
    : null;

  const generalNotes = parseNotes(meeting.general_notes);
  const contentOfficerNotes = parseNotes(meeting.content_officer_notes);

  const sections: ContentInfoSection[] = [];

  // Presentation
  if (!hideEmpty || presentationFiles.length > 0) {
    sections.push({
      key: 'presentation',
      title: 'العرض التقديمي',
      icon: 'presentation',
      type: 'files',
      files: presentationFiles,
      fileColumns: 1,
      emptyTitle: 'لا يوجد عرض تقديمي',
      emptyDescription: 'لم يتم إرفاق عرض تقديمي بعد',
    });
  }

  // Optional attachments
  if (!hideEmpty || optionalFiles.length > 0) {
    sections.push({
      key: 'optional',
      title: 'مرفقات اختيارية',
      icon: 'attachment',
      type: 'files',
      files: optionalFiles,
      fileColumns: 2,
      emptyTitle: 'لا توجد مرفقات اختيارية',
      emptyDescription: 'لم تتم إضافة مرفقات إضافية',
    });
  }

  // Executive summary
  const hasExecSummary = execSummaryText || execSummaryAtts.length > 0;
  if (!hideEmpty || hasExecSummary) {
    sections.push({
      key: 'executive-summary',
      title: 'الملخّص التنفيذي',
      icon: 'summary',
      type: execSummaryAtts.length > 0 ? 'files' : 'text',
      files: execSummaryAtts.length > 0 ? execSummaryAtts : undefined,
      text: execSummaryText,
      fileColumns: 1,
      emptyTitle: 'لا يوجد ملخّص تنفيذي',
      emptyDescription: 'لم يتم إضافة ملخص تنفيذي',
    });
  }

  // Notes
  const hasNotes = generalNotes || contentOfficerNotes;
  if (!hideEmpty || hasNotes) {
    sections.push({
      key: 'notes',
      title: 'ملاحظات',
      icon: 'notes',
      type: 'text',
      text: generalNotes,
      secondaryLabel: 'ملاحظات مسؤول المحتوى',
      secondaryText: contentOfficerNotes,
      emptyTitle: 'لا توجد ملاحظات',
      emptyDescription: 'لم تتم إضافة أي ملاحظات لهذا الطلب',
    });
  }

  return { sections };
}
