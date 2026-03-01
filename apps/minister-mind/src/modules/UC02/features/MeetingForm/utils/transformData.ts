import { formatDateStringToISO } from "@shared";
import { Step1FormData, Step2FormData, Step3FormData } from "../schemas";
import type { InviteeFormRow } from "../schemas/step3.schema";
import { DraftApiResponse } from "../../../data";

export const transformDraftToStep1Data = (draft: DraftApiResponse): Partial<Step1FormData> => {
  return {
    meetingTitle: draft.meeting_title || '',
    meetingSubject: draft.meeting_title || draft.meeting_subject || '',
    meetingSubjectOptional: draft.meeting_subject || '',
    meetingDescription: draft?.description || draft.meeting_description || '',
    meetingType: draft.meeting_type || '',
    meetingCategory: draft.meeting_classification || '',
    meetingReason: draft.meeting_justification || '',
    relatedTopic: draft.related_topic || '',
    dueDate: formatDateStringToISO(draft.deadline),
    meetingClassification1: draft.meeting_classification_type || '',
    meetingConfidentiality: draft.meeting_confidentiality || '',
    sector: draft.sector || '',
    relatedDirective: draft.related_directive_id ? { value: draft.related_directive_id, label: draft.related_directive_id } : null,
    meetingNature: draft.is_sequential === true ? 'SEQUENTIAL' : 'NORMAL',
    previousMeeting: draft.previous_meeting_id || '',
    meetingGoals: draft.objectives?.map((obj: { id: string; objective: string }) => ({
      id: obj.id,
      objective: obj.objective,
    })) || [],
    meetingAgenda: draft.agenda_items?.map((item: {
      id: string;
      agenda_item: string;
      presentation_duration_minutes?: number;
      minister_support_type?: string;
      minister_support_other?: string;
    }) => ({
      id: item.id,
      agenda_item: item.agenda_item || '',
      presentation_duration_minutes: String(item.presentation_duration_minutes ?? ''),
      minister_support_type: item.minister_support_type ?? '',
      minister_support_other: item.minister_support_other ?? '',
    })) || [],
    ministerSupport: draft.minister_support?.map((support: { id: string; support_description: string }) => ({
      id: support.id,
      support_description: support.support_description,
    })) || [],
    relatedDirectives: draft.related_directives?.map((directive: any) => ({
      id: directive.id || '',
      directive: directive.directive_text || '',
      previousMeeting: directive.related_meeting || '',
      directiveDate: formatDateStringToISO(directive.directive_date),
      directiveStatus: directive.directive_status || '',
      dueDate: formatDateStringToISO(directive.deadline),
      responsible: directive.responsible_persons || '',
    })) || [],
    wasDiscussedPreviously: draft.topic_discussed_before || false,
    previousMeetingDate: formatDateStringToISO(draft.previous_meeting_date),
    notes: Array.isArray(draft.general_notes)
      ? draft.general_notes.join('\n')
      : (draft.general_notes || draft.general_note || ''),
    isComplete: draft.is_data_complete ?? false,
  };
};

export const transformDraftToStep2Data = (draft: DraftApiResponse): Partial<Step2FormData> => {
  return {
    presentation_required:
      draft.presentation_required === true || draft.presentation_required === false
        ? draft.presentation_required
        : undefined,
    optional_attachments: [],
  };
};

type DraftInvitee = NonNullable<DraftApiResponse['invitees']>[number];

function mapDraftInviteeToStep3Row(invitee: DraftInvitee, index: number): InviteeFormRow {
  const attendanceMode = (invitee as { attendance_mode?: string }).attendance_mode;
  const viewPerm = (invitee as { view_permission?: boolean }).view_permission;
  return {
    id: invitee.id,
    full_name: invitee.external_name ?? '',
    position_title: invitee.position ?? '',
    mobile_number: invitee.mobile ?? '',
    email: invitee.external_email ?? '',
    attendance_mode: attendanceMode === 'REMOTE' ? 'REMOTE' : 'IN_PERSON',
    view_permission: viewPerm === true,
    isOwner: index === 0,
  };
}

export const transformDraftToStep3Data = (draft: DraftApiResponse): Partial<Step3FormData> => {
  const invitees = (draft.invitees ?? []).map(mapDraftInviteeToStep3Row);
  const minister_invitees = (draft as { minister_invitees?: DraftInvitee[] }).minister_invitees?.map(
    (m) => mapDraftInviteeToStep3Row(m, -1)
  );
  const proposer_user_ids = (draft as { proposer_user_ids?: string[] }).proposer_user_ids;
  return {
    invitees,
    ...(minister_invitees && minister_invitees.length > 0 && { minister_invitees }),
    ...(proposer_user_ids && proposer_user_ids.length > 0 && { proposer_user_ids }),
  };
};