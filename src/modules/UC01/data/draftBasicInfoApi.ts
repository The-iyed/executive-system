import axiosInstance from '@/modules/auth/utils/axios';
import { toISOStringWithTimezone } from '@/lib/ui';
/** Inline type replacing deleted MeetingForm schema */
interface Step1BasicInfoFormData {
  meetingSubject?: string;
  meetingCategory?: string;
  meetingConfidentiality?: string;
  meetingType?: string;
  meetingClassification1?: string;
  meetingChannel?: string;
  meetingLocation?: string;
  meetingLocationOther?: string;
  meeting_location?: string;
  sector?: string;
  relatedTopic?: string;
  dueDate?: string;
  meetingReason?: string;
  meetingDescription?: string;
  meetingAgenda?: Array<{
    agenda_item?: string;
    presentation_duration_minutes?: number;
    minister_support_type?: string;
    minister_support_other?: string;
  }>;
  directiveMethod?: string;
  directiveId?: string;
  directiveText?: string;
  directive_method?: string;
  directive_text?: string;
  duration?: string;
  expectedDuration?: string;
  selectedTimeSlot?: { date?: Date; startTime?: string; endTime?: string };
  alternativeTimeSlot1?: { date?: Date; startTime?: string; endTime?: string };
  alternativeTimeSlot2?: { date?: Date; startTime?: string; endTime?: string };
  voiceNote?: File | null;
  is_urgent?: boolean;
  urgent_reason?: string | null;
  is_on_behalf_of?: boolean;
  meeting_manager_id?: string;
  is_based_on_directive?: boolean;
  previous_meeting_minutes_file?: File | null;
  meeting_start_date?: string;
  meeting_end_date?: string;
  notes?: string;
}

/** Payload for one time slot: create sends slot_start/slot_end; edit (from get-details) can include id. */
export interface TimeSlotPayload {
  id?: string;
  slot_start: string;
  slot_end: string;
}

export interface DraftBasicInfoTimeSlots {
  selected_time_slot?: TimeSlotPayload;
  alternative_time_slot_1?: TimeSlotPayload;
  alternative_time_slot_2?: TimeSlotPayload;
}

export interface SubmitDraftBasicInfoParams {
  formData: FormData;
  draftId?: string;
  isEditMode: boolean;
}

const BASIC_INFO_RESPONSE_ID_KEY = 'id' as const;

/** Appends a scalar field to FormData only when value is present and non-empty. */
function appendIf(value: string | undefined, key: string, fd: FormData): void {
  if (value != null && String(value).trim() !== '') fd.append(key, value.trim());
}

/** Appends an ISO datetime string (accepts YYYY-MM-DD or full ISO 8601). */
function appendDateIf(value: string | undefined, key: string, fd: FormData): void {
  if (!value || value.trim() === '') return;
  const raw = value.trim();
  const date = raw.includes('T') ? new Date(raw) : new Date(raw + 'T00:00:00');
  if (!Number.isNaN(date.getTime())) fd.append(key, toISOStringWithTimezone(date));
}

/** Maps step1 form data to the backend FormData payload for draft basic-info. */
export function buildDraftBasicInfoFormData(form: Partial<Step1BasicInfoFormData>): FormData {
  const fd = new FormData();

  // Core meeting fields
  if (form.meetingSubject) {
    fd.append('meeting_title', form.meetingSubject);
    fd.append('meeting_subject', form.meetingSubject);
  }
  appendIf(form.meetingCategory, 'meeting_classification', fd);
  appendIf(form.meetingConfidentiality, 'meeting_confidentiality', fd);
  appendIf(form.meetingType, 'meeting_type', fd);
  appendIf(form.meetingClassification1, 'meeting_classification_type', fd);
  appendIf(form.meetingChannel, 'meeting_channel', fd);
  appendIf(form.meeting_location, 'meeting_location', fd);
  appendIf(form.sector, 'sector', fd);
  appendIf(form.relatedTopic, 'related_topic', fd);
  appendDateIf(form.dueDate, 'deadline', fd);
  appendIf(form.meetingReason, 'meeting_justification', fd);
  if (form.meetingDescription?.trim()) fd.append('description', form.meetingDescription.trim());

  // Agenda
  if (form.meetingAgenda?.length) {
    const agendaItems = form.meetingAgenda
      .map((a) => {
        const item: Record<string, unknown> = {
          agenda_item: a.agenda_item ?? '',
          presentation_duration_minutes: parseInt(String(a.presentation_duration_minutes ?? 0), 10) || 0,
        };
        if (a.minister_support_type?.trim()) {
          item.minister_support_type = a.minister_support_type;
          if (a.minister_support_type === 'أخرى' && a.minister_support_other?.trim()) {
            item.minister_support_other = a.minister_support_other;
          }
        }
        return item;
      })
      .filter((a) => String(a.agenda_item).trim() !== '');
    if (agendaItems.length) fd.append('agenda_items', JSON.stringify(agendaItems));
  }

  // Booleans
  if (form.is_urgent !== undefined) fd.append('is_urgent', form.is_urgent ? 'true' : 'false');
  if (form.is_on_behalf_of !== undefined) fd.append('is_on_behalf_of', form.is_on_behalf_of ? 'true' : 'false');
  if (form.is_based_on_directive !== undefined) fd.append('is_based_on_directive', form.is_based_on_directive ? 'true' : 'false');

  // Optional text / ids
  appendIf(form.notes, 'note', fd);
  // For PATCH updates, include urgent_reason even when cleared (null/empty)
  // so the backend can overwrite existing value instead of keeping old data.
  if (form.is_urgent) {
    if (Object.prototype.hasOwnProperty.call(form, 'urgent_reason')) {
      fd.append('urgent_reason', (form.urgent_reason ?? '').trim());
    }
  } else if (Object.prototype.hasOwnProperty.call(form, 'urgent_reason')) {
    fd.append('urgent_reason', '');
  }
  if (form.is_on_behalf_of && form.meeting_manager_id) fd.append('meeting_manager_id', form.meeting_manager_id);

  // Meeting date range: proposed meeting date (start/end)
  appendDateIf(form.meeting_start_date, 'meeting_start_date', fd);
  appendDateIf(form.meeting_end_date, 'meeting_end_date', fd);

  // Directive
  if (form.is_based_on_directive && form.directive_method) {
    fd.append('directive_method', form.directive_method);
    if (form.directive_method === 'PREVIOUS_MEETING' && form.previous_meeting_minutes_file instanceof File) {
      fd.append('previous_meeting_minutes_file_content', form.previous_meeting_minutes_file);
    }
    if (form.directive_method === 'DIRECT_DIRECTIVE' && form.directive_text?.trim()) {
      fd.append('directive_text', form.directive_text.trim());
    }
  }

  return fd;
}

/** Submits draft basic-info (POST create or PATCH update). Returns the draft id. */
export async function submitDraftBasicInfo(params: SubmitDraftBasicInfoParams): Promise<string> {
  const { formData, draftId, isEditMode } = params;

  const url = isEditMode && draftId
    ? `/api/meeting-requests/drafts/${draftId}/basic-info`
    : '/api/meeting-requests/drafts/basic-info';
  const method = isEditMode && draftId ? 'patch' as const : 'post' as const;

  const response = await axiosInstance[method]<{ [BASIC_INFO_RESPONSE_ID_KEY]: string }>(url, formData);
  const newDraftId = response.data?.[BASIC_INFO_RESPONSE_ID_KEY] ?? draftId;

  if (!newDraftId) {
    throw new Error('Invalid response format: missing draft ID');
  }

  return newDraftId;
}
