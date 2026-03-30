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

function formatIsoRange(startISO?: string | null, endISO?: string | null): string {
  if (!startISO && !endISO) return '—';
  const start = startISO ? new Date(startISO) : null;
  const end = endISO ? new Date(endISO) : null;
  if (start && Number.isNaN(start.getTime())) return startISO ?? '—';
  if (end && Number.isNaN(end.getTime())) return endISO ?? '—';
  const fmt = (d: Date) =>
    d.toLocaleString('ar', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false, calendar: 'gregory', numberingSystem: 'latn',
    });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
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

  const basicFields = [
    { key: 'is_on_behalf_of', label: 'هل تطلب الاجتماع نيابة عن غيرك؟', value: yesNo(meeting.is_on_behalf_of) },
    { key: 'meeting_owner', label: 'مالك الاجتماع', value: str(meeting.meeting_owner_name) },
    { key: 'meeting_title', label: 'عنوان الاجتماع', value: str(meeting.meeting_title) },
    { key: 'description', label: 'وصف الاجتماع', value: str(meeting.description ?? meeting.meeting_subject) },
    { key: 'sector', label: 'القطاع', value: SECTOR_OPTIONS.find(o => o.value === meeting.sector)?.label ?? str(meeting.sector) },
    { key: 'meeting_type', label: 'نوع الاجتماع', value: getMeetingTypeLabel(meeting.meeting_type) ?? null },
    { key: 'is_urgent', label: 'اجتماع عاجل؟', value: (meeting.urgent_reason || meeting.is_urgent) ? yesNo(true) : null },
    { key: 'urgent_reason', label: 'السبب', value: str(meeting.urgent_reason ?? meeting.meeting_justification) },
    { key: 'time_slot', label: 'موعد الاجتماع المقترح', value: (startDate || endDate) ? formatIsoRange(startDate, endDate) : null },
    { key: 'meeting_channel', label: 'آلية انعقاد الاجتماع', value: channel ? (MeetingChannelLabels[channel] ?? str(channel)) : null },
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
