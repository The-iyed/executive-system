import { formatDateStringToISO } from "@shared";
import { Step1FormData, Step2FormData } from "../schemas";
import { DraftApiResponse } from "../../../data";
import { mapInviteesToFormData } from "./inviteeMappers";

export const transformDraftToStep1Data = (draft: DraftApiResponse): Partial<Step1FormData> => {

    const allAttachments = draft.attachments || [];
  
    return {
      meetingSubject: draft.meeting_subject || '',
      meetingType: draft.meeting_type || '',
      meetingCategory: draft.meeting_classification || '',
      meetingReason: draft.meeting_justification || '',
      relatedTopic: draft.related_topic || '',
      dueDate: formatDateStringToISO(draft.deadline),
      meetingClassification1: draft.meeting_classification_type || '',
      meetingConfidentiality: draft.meeting_confidentiality || '',
      sector: draft.sector || '',
      meetingGoals: draft.objectives?.map((obj) => ({
        id: obj.id,
        objective: obj.objective,
      })) || [],
      meetingAgenda: draft.agenda_items?.map((item) => ({
        id: item.id,
        agenda_item: item.agenda_item || '',
        presentation_duration_minutes: String(item.presentation_duration_minutes || ''),
      })) || [],
      ministerSupport: draft.minister_support?.map((support) => ({
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
      notes: draft.general_note || '',
      // Store all attachments for display in edit mode - no filtering
      existingFiles: allAttachments.map(att => ({
        id: att.id,
        file_name: att.file_name,
        blob_url: att.blob_url,
        file_size: att.file_size,
        file_type: att.file_type,
      })),
    };
  };

  export const transformDraftToStep2Data = (draft: DraftApiResponse): Partial<Step2FormData> => {
    return {
      invitees: mapInviteesToFormData(draft.invitees),
    };
  };

export const transformDraftToStep3Data = (draft: DraftApiResponse): string[] => {
  console.log('draft', draft);
    const slots: string[] = [];
    if (draft?.selected_time_slot?.external_slot_id) {
      slots.push(draft.selected_time_slot.external_slot_id); 
    }
    if (draft?.alternative_time_slot_1?.external_slot_id) {
      slots.push(draft.alternative_time_slot_1.external_slot_id);
    }
    if (draft?.alternative_time_slot_2?.external_slot_id) {
      slots.push(draft.alternative_time_slot_2.external_slot_id);
    }
    return slots;
};