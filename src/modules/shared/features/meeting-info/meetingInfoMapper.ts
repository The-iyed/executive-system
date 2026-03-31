/**
 * Maps raw meeting API response → MeetingInfoViewData for the shared MeetingInfoView.
 */
import type { MeetingInfoViewData, MeetingInfoSection, AgendaItem } from './types';
import {
  SECTOR_OPTIONS,
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
  getMeetingTypeLabel,
  getMeetingConfidentialityLabel,
  getDirectiveMethodLabel,
  getMeetingSubCategoryLabel,
  MeetingChannelLabels,
  MeetingNatureLabels,
} from '../../types';
import { formatDateArabic } from '../../utils/format';

/**
 * Parse date/time components directly from an ISO string without timezone conversion.
 * e.g. "2026-04-07T09:00:00+03:00" → { date: "07/04/2026", time: "09:00" }
 */
function parseIsoRaw(iso: string): { date: string; time: string } | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return { date: `${day}/${month}/${year}`, time: `${hour}:${minute}` };
}

function formatIsoRange(startISO?: string | null, endISO?: string | null): string {
  if (!startISO && !endISO) return '—';
  const start = startISO ? parseIsoRaw(startISO) : null;
  const end = endISO ? parseIsoRaw(endISO) : null;
  if (start && end) {
    if (start.date === end.date) return `${start.date}، ${start.time} – ${end.time}`;
    return `${start.date}، ${start.time} – ${end.date}، ${end.time}`;
  }
  if (start) return `${start.date}، ${start.time}`;
  if (end) return `${end.date}، ${end.time}`;
  return '—';
}

function formatDateOnly(iso?: string | null): string {
  return formatDateArabic(iso) || '—';
}

function yesNo(val?: boolean | null): string | null {
  return val === true ? 'نعم' : val === false ? 'لا' : null;
}

function str(val?: string | null): string | null {
  const trimmed = val?.trim();
  return trimmed || null;
}

/** Raw meeting data shape expected by the mapper */
export interface RawMeetingForInfo {
  is_on_behalf_of?: boolean;
  meeting_owner_name?: string | null;
  meeting_title?: string | null;
  description?: string | null;
  meeting_subject?: string | null;
  sector?: string | null;
  meeting_type?: string | null;
  meeting_nature?: string | null;
  is_urgent?: boolean;
  urgent_reason?: string | null;
  meeting_start_date?: string | null;
  meeting_end_date?: string | null;
  meeting_channel?: string | null;
  meeting_location?: string | null;
  meeting_url?: string | null;
  meeting_link?: string | null;
  meeting_classification?: string | null;
  meeting_sub_category?: string | null;
  meeting_justification?: string | null;
  related_topic?: string | null;
  deadline?: string | null;
  meeting_classification_type?: string | null;
  meeting_confidentiality?: string | null;
  requires_protocol?: boolean;
  agenda_items?: AgendaItem[];
  is_based_on_directive?: boolean;
  directive_method?: string | null;
  related_guidance?: string | null;
  general_notes?: unknown;
  previous_meeting_attachment?: {
    file_name?: string; blob_url?: string;
    file_size?: number; file_type?: string; id?: string;
  } | null;
  // Sequential meeting (UC02)
  is_sequential?: boolean;
  sequential_number?: number | null;
  previous_meeting?: { meeting_title?: string } | null;
  // Schedule overrides
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  selected_time_slot?: { slot_start?: string; slot_end?: string } | null;
  // Notes
  notes?: string;
}

export interface MapMeetingInfoOptions {
  /** Extra fields to append to the basic info section */
  extraFields?: { key: string; label: string; value: React.ReactNode; fullWidth?: boolean }[];
  /** Override channel label (e.g. from schedule form) */
  channelOverride?: string;
  /** Override location */
  locationOverride?: string;
  /** Override meeting link */
  linkOverride?: string;
  /** Override notes text */
  notesOverride?: string;
  /** Override start/end dates */
  startDateOverride?: string;
  endDateOverride?: string;
}

export function mapMeetingToInfo(
  meeting: RawMeetingForInfo | null | undefined,
  options: MapMeetingInfoOptions = {},
): MeetingInfoViewData {
  if (!meeting) return { sections: [], agenda: [] };

  const m = meeting as Record<string, unknown>;

  const channel = options.channelOverride ?? meeting.meeting_channel ?? '';
  const location = options.locationOverride ?? (m.location as string) ?? meeting.meeting_location ?? '';
  const link = options.linkOverride ?? String(meeting.meeting_url || meeting.meeting_link || '').trim();
  const startDate = options.startDateOverride ?? (m.scheduled_start as string) ?? meeting.meeting_start_date ?? meeting.selected_time_slot?.slot_start ?? '';
  const endDate = options.endDateOverride ?? (m.scheduled_end as string) ?? meeting.selected_time_slot?.slot_end ?? '';

  // Derive meeting nature label
  const meetingNatureValue = meeting.meeting_nature
    ? (MeetingNatureLabels[meeting.meeting_nature] ?? str(meeting.meeting_nature))
    : (meeting.is_sequential === true ? 'إلحاقي' : meeting.is_sequential === false ? 'عادي' : null);

  const basicFields = [
    { key: 'meeting_nature', label: 'طبيعة الاجتماع', value: meetingNatureValue },
    { key: 'is_on_behalf_of', label: 'هل تطلب الاجتماع نيابة عن غيرك؟', value: meeting.is_on_behalf_of != null ? yesNo(meeting.is_on_behalf_of) : null },
    { key: 'meeting_owner', label: 'مالك الاجتماع', value: str(meeting.meeting_owner_name) },
    { key: 'meeting_title', label: 'عنوان الاجتماع', value: str(meeting.meeting_title) },
    { key: 'description', label: 'وصف الاجتماع', value: str(meeting.description ?? meeting.meeting_subject) },
    { key: 'sector', label: 'القطاع', value: SECTOR_OPTIONS.find(o => o.value === meeting.sector)?.label ?? str(meeting.sector) },
    { key: 'meeting_type', label: 'نوع الاجتماع', value: getMeetingTypeLabel(meeting.meeting_type) ?? null },
    { key: 'is_urgent', label: 'اجتماع عاجل؟', value: meeting.is_urgent != null ? yesNo(meeting.is_urgent) : null },
    { key: 'urgent_reason', label: 'السبب', value: str(meeting.urgent_reason ?? meeting.meeting_justification) },
    { key: 'time_slot', label: 'موعد الاجتماع المقترح', value: (startDate || endDate) ? formatIsoRange(startDate, endDate) : null },
    { key: 'meeting_channel', label: 'آلية انعقاد الاجتماع', value: channel ? (MeetingChannelLabels[channel] ?? str(channel)) : null },
    { key: 'requires_protocol', label: 'هل يتطلب بروتوكول؟', value: meeting.requires_protocol != null ? yesNo(meeting.requires_protocol) : null },
    { key: 'meeting_location', label: 'الموقع', value: str(location) },
    { key: 'meeting_link', label: 'رابط الاجتماع', value: (channel === 'PHYSICAL') ? null : (link || null), fullWidth: true },
    { key: 'meeting_classification', label: 'فئة الاجتماع', value: getMeetingClassificationLabel(meeting.meeting_classification) ?? null },
    { key: 'meeting_sub_category', label: 'التصنيف الفرعي', value: getMeetingSubCategoryLabel(meeting.meeting_sub_category) ?? null },
    { key: 'meeting_justification', label: 'مبرر اللقاء', value: str(meeting.meeting_justification) },
    { key: 'related_topic', label: 'موضوع التكليف المرتبط', value: str(meeting.related_topic) },
    { key: 'deadline', label: 'تاريخ الاستحقاق', value: meeting.deadline ? formatDateOnly(meeting.deadline) : null },
    { key: 'meeting_classification_type', label: 'تصنيف الاجتماع', value: getMeetingClassificationTypeLabel(meeting.meeting_classification_type) ?? null },
    { key: 'meeting_confidentiality', label: 'سرية الاجتماع', value: getMeetingConfidentialityLabel(meeting.meeting_confidentiality) ?? null },
    ...(options.extraFields ?? []),
  ];

  const basedOnDirective = !!(meeting.related_guidance || meeting.is_based_on_directive);
  const directiveFields = [
    { key: 'is_based_on_directive', label: 'هل طلب الاجتماع بناءً على توجيه من معالي الوزير', value: basedOnDirective ? yesNo(true) : null },
    { key: 'directive_method', label: 'طريقة التوجيه', value: getDirectiveMethodLabel(meeting.directive_method) ?? null },
    { key: 'related_guidance', label: 'التوجيه', value: str(meeting.related_guidance) },
    { key: 'notes', label: 'ملاحظات', value: str(options.notesOverride ?? meeting.notes), fullWidth: true },
  ];

  const sections: MeetingInfoSection[] = [
    { title: 'معلومات الاجتماع', fields: basicFields },
    { title: 'التوجيهات والملاحظات', fields: directiveFields },
  ];

  const agenda: AgendaItem[] = (meeting.agenda_items ?? []).map(item => {
    const ext = item as typeof item & { support_type?: string; support_description?: string };
    return {
      id: item.id,
      agenda_item: item.agenda_item,
      presentation_duration_minutes: item.presentation_duration_minutes,
      minister_support_type: item.minister_support_type ?? ext.support_type,
      minister_support_other: item.minister_support_other ?? ext.support_description,
    };
  });

  return { sections, agenda };
}
