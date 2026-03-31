import React from 'react';
import { ReadOnlyField } from './ReadOnlyField';
import { AgendaPreviewTable, type AgendaItemPreview } from './AgendaPreviewTable';
import { formatDateArabic } from '../utils/format';
import {
  SECTOR_OPTIONS,
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
  getMeetingTypeLabel,
  getMeetingConfidentialityLabel,
  getDirectiveMethodLabel,
  MeetingChannelLabels,
} from '../types';
import { FileIcon } from 'lucide-react';
import { ContentTabFileCard, type ContentTabFileItem } from './Mou7tawaContentTab';

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

function formatIsoRange(startISO: string | null | undefined, endISO: string | null | undefined): string {
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

function formatDateOnly(iso: string | null | undefined): string {
  return formatDateArabic(iso) || '—';
}

/** Single source of truth for field order and labels. Key = editable field id for return-for-info (empty = no checkbox). */
export interface MeetingInfoFieldSpec {
  key: string;
  label: string;
  getValue: (data: MeetingInfoData) => React.ReactNode;
  /** e.g. 'sm:col-span-2' for notes */
  className?: string;
}

/** Build field specs for the first grid (basic info). Used by MeetingInfo and by meetingDetail for editable + checkbox. */
export function getMeetingInfoGridSpecs(): MeetingInfoFieldSpec[] {
  return [
    { key: 'is_on_behalf_of', label: 'هل تطلب الاجتماع نيابة عن غيرك؟', getValue: (d) => (d.is_on_behalf_of === true ? 'نعم' : d.is_on_behalf_of === false ? 'لا' : '—') },
    { key: 'meeting_owner', label: 'مالك الاجتماع', getValue: (d) => d.meeting_manager_label ?? d.meeting_manager_id ?? '—' },
    { key: 'meeting_title', label: 'عنوان الاجتماع', getValue: (d) => d.meetingSubject ?? '—' },
    { key: 'meeting_subject', label: 'وصف الاجتماع', getValue: (d) => d.meetingDescription ?? '—' },
    { key: 'sector', label: 'القطاع', getValue: (d) => (d.sector != null && d.sector !== '' ? SECTOR_OPTIONS.find((o) => o.value === d.sector)?.label ?? d.sector : '—') },
    { key: 'meeting_type', label: 'نوع الاجتماع', getValue: (d) => getMeetingTypeLabel(d.meetingType) ?? '—' },
    { key: 'is_urgent', label: 'اجتماع عاجل؟', getValue: (d) => (d.is_urgent === true ? 'نعم' : d.is_urgent === false ? 'لا' : '—') },
    { key: 'urgent_reason', label: 'السبب', getValue: (d) => d.urgent_reason ?? '—' },
    { key: 'selected_time_slot_id', label: 'موعد الاجتماع المقترح', getValue: (d) => formatIsoRange(d.meeting_start_date, d.meeting_end_date) },
    { key: 'meeting_channel', label: 'آلية انعقاد الاجتماع', getValue: (d) => MeetingChannelLabels[d.meetingChannel ?? ''] ?? d.meetingChannel ?? '—' },
    { key: 'meeting_location', label: 'الموقع', getValue: (d) => d.meeting_location ?? '—' },
    {
      key: 'meeting_link',
      label: 'رابط الاجتماع (Webex)',
      className: 'sm:col-span-2',
      getValue: (d) => {
        const url = d.meeting_link?.trim();
        if (!url) return '—';
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#048F86] underline break-all text-left inline-block max-w-full"
            dir="ltr"
          >
            {url}
          </a>
        );
      },
    },
    { key: 'meeting_classification', label: 'فئة الاجتماع', getValue: (d) => getMeetingClassificationLabel(d.meetingCategory) ?? '—' },
    { key: 'meeting_justification', label: 'مبرر اللقاء', getValue: (d) => d.meetingReason ?? '—' },
    { key: 'related_topic', label: 'موضوع التكليف المرتبط', getValue: (d) => d.relatedTopic ?? '—' },
    { key: 'deadline', label: 'تاريخ الاستحقاق', getValue: (d) => formatDateOnly(d.dueDate) },
    { key: 'meeting_classification_type', label: 'تصنيف الاجتماع', getValue: (d) => getMeetingClassificationTypeLabel(d.meetingClassification1) ?? '—' },
    { key: 'meeting_confidentiality', label: 'سرية الاجتماع', getValue: (d) => getMeetingConfidentialityLabel(d.meetingConfidentiality) ?? '—' },
  ];
}

/** Specs for the second grid (directive + notes). */
export function getMeetingInfoDirectiveSpecs(): MeetingInfoFieldSpec[] {
  const fileDisplay = (d: MeetingInfoData): React.ReactNode => {
    const attachment = d.previous_meeting_attachment;
    const legacyFile = d.previous_meeting_minutes_file;
    const name =
      attachment?.file_name ??
      (attachment && 'name' in attachment ? (attachment as { name?: string }).name : undefined) ??
      (legacyFile != null && typeof legacyFile === 'object' && 'name' in legacyFile
        ? (legacyFile as { name?: string }).name
        : (legacyFile as File)?.name);

    if (attachment && (attachment.file_name || attachment.blob_url)) {
      const fileItem: ContentTabFileItem = {
        id: attachment.id ?? 'previous-meeting-minutes',
        file_name: attachment.file_name ?? name ?? '—',
        file_size: attachment.file_size ?? 0,
        file_type: attachment.file_type ?? '',
        blob_url: attachment.blob_url ?? null,
      };
      return (
        <ContentTabFileCard
          file={fileItem}
          readOnly
          onView={fileItem.blob_url ? () => window.open(fileItem.blob_url!, '_blank') : undefined}
          onDownload={fileItem.blob_url ? () => window.open(fileItem.blob_url!, '_blank') : undefined}
        />
      );
    }

    if (name) {
      return (
        <div className="flex items-center gap-3 bg-white border border-[#E4E7EC] rounded-lg px-4 py-3" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
          <FileIcon className="h-5 w-5 text-[#667085] flex-shrink-0" />
          <p className="text-sm font-medium text-[#344054] truncate flex-1 text-right">{name}</p>
        </div>
      );
    }
    return '—';
  };

  return [
    { key: 'is_based_on_directive', label: 'هل طلب الاجتماع بناءً على توجيه من معالي الوزير', getValue: (d) => (d.is_based_on_directive === true ? 'نعم' : d.is_based_on_directive === false ? 'لا' : '—') },
    { key: 'directive_method', label: 'طريقة التوجيه', getValue: (d) => getDirectiveMethodLabel(d.directive_method) ?? '—' },
    { key: 'previous_meeting_minutes_id', label: 'محضر الاجتماع', getValue: fileDisplay, className: 'sm:col-span-2' },
    { key: 'related_guidance', label: 'التوجيه', getValue: (d) => d.directive_text ?? '—' },
    { key: 'general_notes', label: 'ملاحظات', getValue: (d) => d.notes ?? '—', className: 'sm:col-span-2' },
  ];
}

/** Data for MeetingInfo preview – same shape as Step1 basic info, all optional. */
export interface MeetingInfoData {
  is_on_behalf_of?: boolean;
  meeting_manager_id?: string;
  meeting_manager_label?: string;
  meetingSubject?: string;
  meetingDescription?: string;
  sector?: string;
  meetingType?: string;
  is_urgent?: boolean;
  urgent_reason?: string;
  meeting_start_date?: string;
  meeting_end_date?: string;
  meetingChannel?: string;
  meeting_location?: string;
  meetingCategory?: string;
  meetingReason?: string;
  relatedTopic?: string;
  dueDate?: string;
  meetingClassification1?: string;
  meetingConfidentiality?: string;
  meetingAgenda?: AgendaItemPreview[];
  /** Previous meeting minutes attachment (from API: file_name, blob_url, etc.). */
  previous_meeting_attachment?: {
    id?: string;
    meeting_request_id?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    content_type?: string;
    uploaded_by?: string;
    uploaded_at?: string;
    blob_url?: string;
    source?: string;
    name?: string;
  } | null;
  /** UC02 meeting detail only: sequential meeting flag */
  is_sequential?: boolean;
  /** UC02 meeting detail only: selected previous meeting display title */
  previous_meeting_meeting_title?: string | null;
  /** UC02 meeting detail only: computed الرقم التسلسلي display text */
  sequential_number_display?: string;
  is_based_on_directive?: boolean;
  directive_method?: string;
  previous_meeting_minutes_file?: File | { name?: string } | null;
  directive_text?: string;
  notes?: string;
  /** Join URL for VIRTUAL/HYBRID (Webex); from API meeting_url / meeting_link */
  meeting_link?: string | null;
}

/** When provided, each field is rendered by this function (e.g. checkbox + label + editable input). Key = editable field id. */
export type MeetingInfoRenderField = (key: string, label: string, value: React.ReactNode, spec: MeetingInfoFieldSpec) => React.ReactNode;

export interface MeetingInfoProps {
  /** All Step1 basic info fields (all optional). Every field is shown; missing values render as "—". */
  data: MeetingInfoData;
  /** Optional class for the root container */
  className?: string;
  /** RTL */
  dir?: 'rtl' | 'ltr';
  /** When set, each field is rendered by this function (e.g. editable row with checkbox). Otherwise ReadOnlyField. */
  renderField?: MeetingInfoRenderField;
  /** Optional extra field specs (e.g. UC02: is_sequential, previous_meeting_id). Rendered at end of first grid. */
  extraGridSpecs?: MeetingInfoFieldSpec[];
}

/**
 * Read-only preview of meeting basic info (Step1). Same fields and order as Step1BasicInfo;
 * no validation, no conditional hiding – all fields appear, everything disabled.
 * When renderField is provided (e.g. from meeting detail when canEdit), each field is rendered by it.
 */
export function MeetingInfo({ data, className = '', dir = 'rtl', renderField, extraGridSpecs }: MeetingInfoProps) {
  const gridSpecs = React.useMemo(() => [...getMeetingInfoGridSpecs(), ...(extraGridSpecs ?? [])], [extraGridSpecs]);
  const directiveSpecs = React.useMemo(() => getMeetingInfoDirectiveSpecs(), []);

  const renderCell = (spec: MeetingInfoFieldSpec) => {
    const value = spec.getValue(data);
    if (renderField) return renderField(spec.key, spec.label, value, spec);
    if (spec.className === 'sm:col-span-2')
      return (
        <ReadOnlyField
          key={spec.key || spec.label}
          label={spec.label}
          value={value}
          className={spec.className}
          valueClassName="w-full min-h-[80px] px-3 py-2 flex items-start bg-gray-50 border border-gray-200 rounded-lg text-right"
        />
      );
    return <ReadOnlyField key={spec.key || spec.label} label={spec.label} value={value} className={spec.className} />;
  };

  return (
    <div className={`w-full flex flex-col gap-8 ${className}`} dir={dir} data-meeting-info>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-[20px]  sm:gap-6 w-full max-w-[1200px] mx-auto px-4 [&>div]:min-w-0 [&>div]:w-full">
        {gridSpecs.map((spec) => (
          <div key={spec.key || spec.label} className={spec.className}>
            {renderCell(spec)}
          </div>
        ))}
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-0">
        {renderField ? (
          renderField(
            'agenda_items',
            'أجندة الاجتماع',
            <AgendaPreviewTable title="" items={data.meetingAgenda ?? undefined} dir={dir} />,
            { key: 'agenda_items', label: 'أجندة الاجتماع', getValue: () => null, className: 'sm:col-span-2' }
          )
        ) : (
          <AgendaPreviewTable
            title="أجندة الاجتماع"
            items={data.meetingAgenda ?? undefined}
            dir={dir}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-[20px]  sm:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full">
        {directiveSpecs.map((spec) => (
          <div key={spec.key || spec.label} className={spec.className}>
            {renderCell(spec)}
          </div>
        ))}
      </div>
    </div>
  );
}