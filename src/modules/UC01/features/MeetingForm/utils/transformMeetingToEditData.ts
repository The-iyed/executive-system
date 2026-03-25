/**
 * ONLY for "Edit from meeting details" (UC02). NOT used by UC01.
 *
 * When user clicks "تعديل" on the meeting detail page, the form is opened with
 * initialMeetingData from getMeetingById. This module transforms that API shape
 * into the step data the UC01 edit form expects. UC01's normal edit flow (from
 * meetings list / draft) uses getDraftById + transformDraftToStep* in transformData.ts
 * and never uses this file.
 */
import { formatDateStringToISO, toISOStringWithTimezone } from '@/modules/shared';
import type { Step1BasicInfoFormData } from '../schemas/step1BasicInfo.schema';
import type { Step2ContentFormData } from '../schemas/step2Content.schema';
import type { Step3InviteesFormData } from '../schemas/step3Invitees.schema';
import { getMeetingLocationDropdownValue } from './constants';
import { AttendanceMechanism } from '@/modules/shared/types';

type InviteeFormData = Step3InviteesFormData['invitees'][number];

function toISOOrDateString(val: string | null | undefined): string {
  if (!val || String(val).trim() === '') return '';
  const d = new Date(String(val).trim());
  return Number.isNaN(d.getTime()) ? '' : toISOStringWithTimezone(d);
}

/** Minimal shape from GET /api/meetings/:id (MeetingApiResponse) for edit form */
export interface MeetingForEdit {
  id: string;
  status?: string | null;
  /** API often returns meeting_title; meeting_subject may be null */
  meeting_title?: string | null;
  meeting_subject?: string | null;
  meeting_type?: string | null;
  meeting_classification?: string | null;
  meeting_justification?: string | null;
  description?: string | null;
  related_topic?: string | null;
  deadline?: string | null;
  meeting_classification_type?: string | null;
  meeting_confidentiality?: string | null;
  meeting_channel?: string | null;
  meeting_location?: string | null;
  sector?: string | null;
  note?: string | null;
  is_urgent?: boolean | null;
  urgent_reason?: string | null;
  is_on_behalf_of?: boolean | null;
  is_based_on_directive?: boolean | null;
  directive_method?: string | null;
  /** Scheduled times when meeting_start_date/meeting_end_date are null (e.g. SCHEDULED meetings) */
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  meeting_start_date?: string | null;
  meeting_end_date?: string | null;
  selected_time_slot?: { slot_start?: string; slot_end?: string } | null;
  agenda_items?: Array<{
    id?: string;
    agenda_item?: string | null;
    presentation_duration_minutes?: number | null;
    /** Inline minister support (API may return this on each item instead of minister_support array) */
    minister_support_type?: string | null;
    minister_support_other?: string | null;
  }> | null;
  minister_support?: Array<{ id?: string; support_description?: string | null }> | null;
  attachments?: Array<{
    id: string;
    file_name?: string;
    blob_url?: string;
    file_size?: number;
    file_type?: string;
    is_presentation?: boolean;
    is_additional?: boolean;
  }> | null;
  invitees?: Array<{
    id: string;
    user_id?: string | null;
    /** New identifier preferred when present (directory object GUID). */
    object_guid?: string | null;
    external_email?: string | null;
    external_name?: string | null;
    position?: string | null;
    mobile?: string | null;
    sector?: string | null;
    is_required?: boolean;
    attendance_mechanism?: string | null;
  }> | null;
  /** قائمة المدعوين (الوزير) – shown in edit form only for UC02 (scheduling officer) */
  minister_attendees?: Array<{
    id?: string;
    username?: string | null;
    external_name?: string | null;
    external_email?: string | null;
    position?: string | null;
    mobile?: string | null;
    phone?: string | null;
    sector?: string | null;
    is_required?: boolean;
    justification?: string | null;
    access_permission?: string | null;
    attendance_channel?: 'PHYSICAL' | 'REMOTE' | null;
    is_consultant?: boolean;
  }> | null;
  presentation_attachment_timing?: string | null;
}

type MeetingInvitee = NonNullable<NonNullable<MeetingForEdit['invitees']>[number]>;

function mapMeetingInviteeToFormData(inv: MeetingInvitee): InviteeFormData {
  const invAny = inv as {
    id: string;
    user_id?: string | null;
    object_guid?: string | null;
    external_email?: string | null;
    external_name?: string | null;
    position?: string | null;
    mobile?: string | null;
    sector?: string | null;
    is_required?: boolean;
    attendance_mechanism?: string | null;
  } | undefined;
  if (!invAny) {
    return {
      id: '',
      name: '',
      position: '',
      mobile: '',
      email: '',
      sector: '',
      is_required: false,
      attendance_mechanism: AttendanceMechanism.PHYSICAL,
    };
  }
  const objectGuid = (invAny.object_guid ?? invAny.user_id) ?? undefined;
  return {
    id: invAny.id,
    name: invAny.external_name ?? '',
    position: invAny.position ?? '',
    mobile: invAny.mobile ?? '',
    email: invAny.external_email ?? '',
    sector: invAny.sector ?? '',
    is_required: invAny.is_required ?? false,
    object_guid: objectGuid,
    username: undefined,
    disabled: !!objectGuid,
    attendance_mechanism:
      (invAny.attendance_mechanism as AttendanceMechanism | null | undefined) ?? AttendanceMechanism.PHYSICAL,
  };
}

export function transformMeetingToStep1Data(meeting: MeetingForEdit): Partial<Step1BasicInfoFormData> {
  const agendaItems = meeting.agenda_items ?? [];
  const ministerSupport = meeting.minister_support ?? [];
  // عنوان الاجتماع: API may return meeting_title only (meeting_subject null)
  const meetingSubject = (meeting.meeting_subject ?? meeting.meeting_title ?? '').trim() || '';
  // موعد الاجتماع: use scheduled_start/scheduled_end when meeting_start_date/meeting_end_date and selected_time_slot are null (e.g. SCHEDULED)
  const startSource =
    meeting.selected_time_slot?.slot_start ??
    meeting.meeting_start_date ??
    meeting.scheduled_start;
  const endSource =
    meeting.selected_time_slot?.slot_end ??
    meeting.meeting_end_date ??
    meeting.scheduled_end;
  return {
    meetingSubject,
    meetingType: meeting.meeting_type ?? '',
    meetingCategory: meeting.meeting_classification ?? '',
    meetingReason: meeting.meeting_justification ?? '',
    meetingDescription: meeting.description ?? '',
    relatedTopic: meeting.related_topic ?? '',
    dueDate: formatDateStringToISO(meeting.deadline),
    meetingClassification1: meeting.meeting_classification_type ?? '',
    meetingConfidentiality: meeting.meeting_confidentiality ?? 'NORMAL',
    meetingChannel: meeting.meeting_channel ?? '',
    meeting_location: meeting.meeting_location ?? '',
    meeting_location_option: getMeetingLocationDropdownValue(meeting.meeting_location ?? undefined, undefined),
    sector: meeting.sector ?? '',
    meetingAgenda: agendaItems.map((item, idx) => {
      const support = ministerSupport[idx];
      const itemWithSupport = item as typeof item & { minister_support_type?: string | null; minister_support_other?: string | null };
      // Prefer inline minister_support_type / minister_support_other on agenda item (current API); fallback to legacy minister_support array
      const minister_support_type = (itemWithSupport.minister_support_type ?? support?.support_description ?? '').trim() || '';
      const minister_support_other = (itemWithSupport.minister_support_other ?? '').trim() || '';
      return {
        id: item.id ?? '',
        agenda_item: item.agenda_item ?? '',
        presentation_duration_minutes: String(item.presentation_duration_minutes ?? ''),
        minister_support_type,
        minister_support_other,
      };
    }),
    notes: meeting.note ?? '',
    is_urgent: meeting.is_urgent ?? false,
    urgent_reason: meeting.urgent_reason ?? '',
    is_on_behalf_of: meeting.is_on_behalf_of ?? false,
    is_based_on_directive: meeting.is_based_on_directive ?? false,
    directive_method: meeting.directive_method ?? '',
    meeting_start_date: toISOOrDateString(startSource) ?? '',
    meeting_end_date: toISOOrDateString(endSource) ?? '',
  };
}

export function transformMeetingToStep2ContentData(meeting: MeetingForEdit): Partial<Step2ContentFormData> {
  const attachments = meeting.attachments ?? [];
  const presentationAttachments = attachments.filter((a) => a.is_presentation);
  const additionalAttachments = attachments.filter((a) => a.is_additional);
  const presentationTiming = meeting.presentation_attachment_timing
    ? formatDateStringToISO(meeting.presentation_attachment_timing)
    : undefined;
  return {
    presentation_files: [],
    presentation_attachment_timing: presentationTiming ?? '',
    additional_files: [],
    existingFiles: presentationAttachments.map((att) => ({
      id: att.id,
      file_name: att.file_name ?? '',
      blob_url: att.blob_url ?? '',
      file_size: att.file_size,
      file_type: att.file_type,
    })),
    existingAdditionalFiles: additionalAttachments.map((att) => ({
      id: att.id,
      file_name: att.file_name ?? '',
      blob_url: att.blob_url ?? '',
      file_size: att.file_size,
      file_type: att.file_type,
    })),
  };
}

export function transformMeetingToStep3InviteesData(meeting: MeetingForEdit): Partial<Step3InviteesFormData> {
  const invitees = meeting.invitees ?? [];
  const minister_attendees = (meeting.minister_attendees ?? []).map((m, i) => ({
    id: (m as { id?: string }).id ?? `minister-${i}-${Date.now()}`,
    external_name: (m as { external_name?: string | null }).external_name ?? (m as { username?: string | null }).username ?? '',
    position: (m as { position?: string | null }).position ?? '',
    external_email: (m as { external_email?: string | null }).external_email ?? '',
    mobile: ((m as { mobile?: string | null }).mobile ?? (m as { phone?: string | null }).phone ?? '') as string,
    attendance_channel: ((m as { attendance_channel?: string }).attendance_channel === 'REMOTE' ? 'REMOTE' : 'PHYSICAL') as 'PHYSICAL' | 'REMOTE',
    is_required: (m as { is_required?: boolean }).is_required ?? false,
    justification: (m as { justification?: string | null }).justification ?? '',
  }));
  return {
    invitees: invitees.map(mapMeetingInviteeToFormData),
    minister_attendees,
  };
}

export function transformMeetingToInitialData(meeting: MeetingForEdit) {
  return {
    step1BasicInfo: transformMeetingToStep1Data(meeting),
    step2Content: transformMeetingToStep2ContentData(meeting),
    step3Invitees: transformMeetingToStep3InviteesData(meeting),
  };
}
