import axiosInstance from '@auth/utils/axios';
import type { Step1FormData } from '../../NewMeeting/steps/Step1/schema';
import type { Step2FormData } from '../../NewMeeting/steps/Step2/schema';

/**
 * API Response type matching the backend structure
 * Based on the example response provided
 */
export interface DraftApiResponse {
  id: string;
  request_number: string;
  status: string;
  meeting_title: string;
  meeting_type: string;
  meeting_subject: string;
  meeting_classification: string;
  meeting_classification_type: string;
  meeting_confidentiality: string;
  sector?: string | null;
  related_topic?: string | null;
  deadline?: string | null;
  meeting_justification?: string | null;
  objectives?: Array<{ id: string; objective: string }>;
  agenda_items?: Array<{
    id: string;
    agenda_item: string;
    presentation_duration_minutes: number;
  }>;
  minister_support?: Array<{ id: string; support_description: string }>;
  related_directive_ids?: string[];
  related_directives?: Array<any>;
  topic_discussed_before?: boolean;
  previous_meeting_date?: string | null;
  general_notes?: string | null;
  content_officer_notes?: string | null;
  attachments?: Array<{
    id: string;
    file_name: string;
    blob_name?: string;
    blob_url: string;
    file_size?: number;
    file_type?: string;
    content_type?: string;
    uploaded_by?: string;
    uploaded_at?: string;
    is_presentation: boolean;
    is_additional: boolean;
    is_executive_summary?: boolean;
    version?: number;
    is_latest?: boolean;
  }>;
  invitees?: Array<{
    id: string;
    user_id?: string | null;
    external_email?: string | null;
    external_name?: string | null;
    is_required: boolean;
    response_status?: string;
    attendee_source?: string;
    justification?: string | null;
    access_permission?: string | null;
  }>;
  selected_time_slot_id?: string | null;
  alternative_time_slot_id_1?: string | null;
  alternative_time_slot_id_2?: string | null;
}

/**
 * Fetch draft data by ID
 */
export const getDraftById = async (draftId: string): Promise<DraftApiResponse> => {
  const response = await axiosInstance.get<DraftApiResponse>(
    `/api/meeting-requests/drafts/${draftId}`
  );
  return response.data;
};

/**
 * Transform API response to Step1 form data
 */
export const transformDraftToStep1Data = (draft: DraftApiResponse): Partial<Step1FormData> => {
  // Format date from ISO string to YYYY-MM-DD
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  return {
    meetingSubject: draft.meeting_subject || '',
    meetingType: draft.meeting_type || '',
    meetingCategory: draft.meeting_classification || '',
    meetingReason: draft.meeting_justification || '',
    relatedTopic: draft.related_topic || '',
    dueDate: formatDate(draft.deadline),
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
      directiveDate: formatDate(directive.directive_date),
      directiveStatus: directive.directive_status || '',
      dueDate: formatDate(directive.deadline),
      responsible: directive.responsible_persons || '',
    })) || [],
    wasDiscussedPreviously: draft.topic_discussed_before || false,
    previousMeetingDate: formatDate(draft.previous_meeting_date),
    notes: draft.general_notes || '',
    // File is not included as it's a File object, not a URL
    // User will need to re-upload if they want to change it
  };
};

/**
 * Transform API response to Step2 form data
 */
export const transformDraftToStep2Data = (draft: DraftApiResponse): Partial<Step2FormData> => {
  return {
    invitees: draft.invitees?.map((invitee) => {
      // Use external_name if available, otherwise use user_id as placeholder
      // In a real scenario, you might want to fetch the user name from user_id
      const name = invitee.external_name || (invitee.user_id ? `User ${invitee.user_id.substring(0, 8)}` : '');
      
      return {
        id: invitee.id,
        name: name,
        position: '', // Not available in API response
        mobile: '', // Not available in API response
        email: invitee.external_email || '',
        is_required: invitee.is_required || false,
      };
    }) || [],
  };
};

/**
 * Transform API response to Step3 form data (selected slots)
 */
export const transformDraftToStep3Data = (draft: DraftApiResponse): string[] => {
  const slots: string[] = [];
  if (draft.selected_time_slot_id) {
    slots.push(draft.selected_time_slot_id);
  }
  if (draft.alternative_time_slot_id_1) {
    slots.push(draft.alternative_time_slot_id_1);
  }
  if (draft.alternative_time_slot_id_2) {
    slots.push(draft.alternative_time_slot_id_2);
  }
  return slots;
};
