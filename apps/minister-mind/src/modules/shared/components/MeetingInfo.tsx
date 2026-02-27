import { ReadOnlyField } from './ReadOnlyField';
import { AgendaPreviewTable, type AgendaItemPreview } from './AgendaPreviewTable';
import {
  SECTOR_OPTIONS,
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
  getMeetingTypeLabel,
  getMeetingConfidentialityLabel,
  getMeetingChannelLabel,
  getDirectiveMethodLabel,
} from '../types';

function formatIsoRange(startISO: string | null | undefined, endISO: string | null | undefined): string {
  if (!startISO && !endISO) return '—';
  const start = startISO ? new Date(startISO) : null;
  const end = endISO ? new Date(endISO) : null;
  if (start && Number.isNaN(start.getTime())) return startISO ?? '—';
  if (end && Number.isNaN(end.getTime())) return endISO ?? '—';
  const fmt = (d: Date) =>
    d.toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return '—';
}

function formatDateOnly(iso: string | null | undefined): string {
  if (!iso || iso.trim() === '') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** فئة الاجتماع: resolve from both category (MeetingClassification) and type (MeetingClassificationType) so e.g. SPECIAL → خاص */
function getMeetingCategoryDisplayLabel(value: string | null | undefined): string {
  const fromCategory = getMeetingClassificationLabel(value);
  if (fromCategory !== '-' && fromCategory !== (value ?? '')) return fromCategory;
  return getMeetingClassificationTypeLabel(value);
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
  alternative_1_start_date?: string;
  alternative_1_end_date?: string;
  alternative_2_start_date?: string;
  alternative_2_end_date?: string;
  meetingChannel?: string;
  meeting_location?: string;
  meetingCategory?: string;
  meetingReason?: string;
  relatedTopic?: string;
  dueDate?: string;
  meetingClassification1?: string;
  meetingConfidentiality?: string;
  meetingAgenda?: AgendaItemPreview[];
  is_based_on_directive?: boolean;
  directive_method?: string;
  previous_meeting_minutes_file?: File | { name?: string } | null;
  directive_text?: string;
  notes?: string;
}

export interface MeetingInfoProps {
  /** All Step1 basic info fields (all optional). Every field is shown; missing values render as "—". */
  data: MeetingInfoData;
  /** Optional class for the root container */
  className?: string;
  /** RTL */
  dir?: 'rtl' | 'ltr';
}

/**
 * Read-only preview of meeting basic info (Step1). Same fields and order as Step1BasicInfo;
 * no validation, no conditional hiding – all fields appear, everything disabled.
 */
export function MeetingInfo({ data, className = '', dir = 'rtl' }: MeetingInfoProps) {
  const sectorLabel =
    data.sector != null && data.sector !== ''
      ? SECTOR_OPTIONS.find((o) => o.value === data.sector)?.label ?? data.sector
      : '—';

  const fileDisplay =
    data.previous_meeting_minutes_file != null
      ? typeof data.previous_meeting_minutes_file === 'object' && 'name' in data.previous_meeting_minutes_file
        ? (data.previous_meeting_minutes_file as { name?: string }).name ?? 'مرفق'
        : (data.previous_meeting_minutes_file as File)?.name ?? 'مرفق'
      : '—';

  return (
    <div className={`w-full flex flex-col gap-8 ${className}`} dir={dir} data-meeting-info>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full">
        <ReadOnlyField
          label="هل تطلب الاجتماع نيابة عن غيرك؟"
          value={data.is_on_behalf_of === true ? 'نعم' : data.is_on_behalf_of === false ? 'لا' : '—'}
        />
        <ReadOnlyField
          label="مالك الاجتماع"
          value={data.meeting_manager_label ?? data.meeting_manager_id ?? '—'}
        />
        <ReadOnlyField label="عنوان الاجتماع" value={data.meetingSubject} />
        <ReadOnlyField label="وصف الاجتماع" value={data.meetingDescription} />
        <ReadOnlyField label="القطاع" value={sectorLabel} />
        <ReadOnlyField label="نوع الاجتماع" value={getMeetingTypeLabel(data.meetingType)} />
        <ReadOnlyField
          label="اجتماع عاجل؟"
          value={data.is_urgent === true ? 'نعم' : data.is_urgent === false ? 'لا' : '—'}
        />
        <ReadOnlyField label="السبب" value={data.urgent_reason} />

        <ReadOnlyField
          label="موعد الاجتماع"
          value={formatIsoRange(data.meeting_start_date, data.meeting_end_date)}
        />
        <ReadOnlyField
          label="الموعد البديل الأول"
          value={formatIsoRange(data.alternative_1_start_date, data.alternative_1_end_date)}
        />
        <ReadOnlyField
          label="الموعد البديل الثاني"
          value={formatIsoRange(data.alternative_2_start_date, data.alternative_2_end_date)}
        />

        <ReadOnlyField
          label="آلية انعقاد الاجتماع"
          value={getMeetingChannelLabel(data.meetingChannel)}
        />
        <ReadOnlyField label="الموقع" value={data.meeting_location} />

        <ReadOnlyField
          label="فئة الاجتماع"
          value={getMeetingCategoryDisplayLabel(data.meetingCategory)}
        />
        <ReadOnlyField label="مبرر اللقاء" value={data.meetingReason} />
        <ReadOnlyField label="موضوع التكليف المرتبط" value={data.relatedTopic} />
        <ReadOnlyField label="تاريخ الاستحقاق" value={formatDateOnly(data.dueDate)} />
        <ReadOnlyField
          label="تصنيف الاجتماع"
          value={getMeetingClassificationTypeLabel(data.meetingClassification1)}
        />
        <ReadOnlyField
          label="سرية الاجتماع"
          value={getMeetingConfidentialityLabel(data.meetingConfidentiality)}
        />
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-0">
        <AgendaPreviewTable
          title="أجندة الاجتماع"
          items={data.meetingAgenda ?? undefined}
          dir={dir}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full">
        <ReadOnlyField
          label="هل طلب الاجتماع بناءً على توجيه من معالي الوزير"
          value={data.is_based_on_directive === true ? 'نعم' : data.is_based_on_directive === false ? 'لا' : '—'}
        />
        <ReadOnlyField
          label="طريقة التوجيه"
          value={getDirectiveMethodLabel(data.directive_method)}
        />
        <ReadOnlyField label="محضر الاجتماع" value={fileDisplay} />
        <ReadOnlyField label="التوجيه" value={data.directive_text} />
        <ReadOnlyField
          label="ملاحظات"
          value={data.notes}
          className="sm:col-span-2"
          valueClassName="w-full min-h-[80px] px-3 py-2 flex items-start bg-gray-50 border border-gray-200 rounded-lg text-right"
        />
      </div>
    </div>
  );
}