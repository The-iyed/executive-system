import axiosInstance from '@auth/utils/axios';

export interface TimeSlotApiResponse {
  id: string;
  slot_start: string;
  slot_end?: string | null;
  is_available?: boolean;
  is_selected?: boolean;
  external_slot_id?: string | null;
}

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
  meeting_channel?: string | null;
  sector?: string | null;
  related_topic?: string | null;
  deadline?: string | null;
  meeting_justification?: string | null;
  meeting_description?: string | null;
  meeting_location?: string | null;
  objectives?: Array<{ id: string; objective: string }>;
  agenda_items?: Array<{
    id: string;
    agenda_item: string;
    presentation_duration_minutes: number;
    minister_support_type?: string | null;
    minister_support_other?: string | null;
  }>;
  related_directive_ids?: string[];
  related_directives?: Array<any>;
  topic_discussed_before?: boolean;
  previous_meeting_date?: string | null;
  is_urgent?: boolean;
  urgent_reason?: string | null;
  general_notes?: string | string[] | null;
  general_note?: string | null;
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
    position?: string | null;
    mobile?: string | null;
    attendance_mechanism?: string | null;
    item_number?: number | null;
    is_required: boolean;
    response_status?: string;
    attendee_source?: string;
    justification?: string | null;
    access_permission?: string | null;
  }>;
  selected_time_slot_id?: string | null;
  alternative_time_slot_id_1?: string | null;
  alternative_time_slot_id_2?: string | null;
  selected_time_slot?:TimeSlotApiResponse;
  alternative_time_slot_1?:TimeSlotApiResponse;
  alternative_time_slot_2?:TimeSlotApiResponse;
}

export const getDraftById = async (draftId: string): Promise<DraftApiResponse> => {
  const response = await axiosInstance.get<DraftApiResponse>(
    `/api/meeting-requests/drafts/${draftId}`
  );
  return response.data;
};