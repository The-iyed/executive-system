// Import axios instance
import { TableRow } from '@/lib/dynamic-table-form';
import axiosInstance from '../../auth/utils/axios';

export interface Attachment {
  id: string;
  file_name: string;
  blob_name: string;
  blob_url: string;
  file_size: number;
  file_type: string;
  content_type: string;
  uploaded_by: string;
  uploaded_at: string;
  is_presentation: boolean;
  is_additional: boolean;
  is_executive_summary: boolean;
  version: number;
  is_latest: boolean;
}

export interface ContentConsultationRequestApiResponse {
  id: string;
  request_number: string;
  status: string;
  current_owner_type: string;
  current_owner_user_id: string;
  current_owner_role_id: string;
  submitter_id: string;
  submitter_name: string | null;
  submitter?: Record<string, unknown> | string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  scheduled_at: string | null;
  closed_at: string | null;
  version: number;
  meeting_title: string;
  meeting_type: string;
  meeting_subject: string;
  meeting_classification: string;
  presentation_duration: number;
  is_data_complete: boolean;
  requires_protocol: boolean;
  protocol_type: string | null;
  meeting_channel: string;
  is_sequential: boolean;
  sequential_number: number | null;
  previous_meeting_id: string | null;
  is_direct_schedule: boolean;
  attachments: Attachment[];
}

export interface ContentConsultationRequestsListResponse {
  items: ContentConsultationRequestApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetContentConsultationRequestsParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export const getAssignedContentConsultationRequests = async (
  params: GetContentConsultationRequestsParams = {}
): Promise<ContentConsultationRequestsListResponse> => {
  const queryParams = new URLSearchParams();

  queryParams.append('consultation_status', 'PENDING');

  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  const response = await axiosInstance.get<ContentConsultationRequestsListResponse>(
    `/api/consultations/my-meetings?${queryParams.toString()}`
  );
  return response.data;
};

// Extended types for detail response
export interface ContentConsultationRequestDetailResponse {
  meeting_request: ContentConsultationRequestApiResponse & {
    objectives?: Array<{
      id: string;
      objective: string;
    }>;
    agenda_items?: Array<{
      id: string;
      agenda_item: string;
      presentation_duration_minutes: number;
    }>;
    minister_support?: Array<{
      id: string;
      support_description: string;
    }>;
    invitees?:TableRow[];
    selected_time_slot_id?: string | null;
    alternative_time_slot_id_1?: string | null;
    alternative_time_slot_id_2?: string | null;
    selected_time_slot?: any;
    alternative_time_slot_1?: any;
    alternative_time_slot_2?: any;
    related_directive_ids?: string[];
    related_guidance?: any;
    general_notes?: string | null;
    content_officer_notes?: string | null;
    meeting_justification?: string;
    related_topic?: string;
    deadline?: string | null;
    meeting_classification_type?: string;
    meeting_confidentiality?: string;
    sector?: string;
    is_on_behalf_of?: boolean;
    current_owner_user?: {
      id: string;
      first_name: string;
      last_name: string;
    } | null;
    current_owner_role?: {
      id: string;
      name_ar: string;
    } | null;
    content_approval_directives?: Array<{
      id: number;
      title: string;
      due_date: string | null;
      assignees: string[];
      status: string;
    }>;
  };
  consultation_question: string;
  consultation_id: string;
  content_approval_directives?: Array<{
    id: number;
    title: string;
    due_date: string | null;
    assignees: string[];
    status: string;
  }>;
}

export const getContentConsultationRequestById = async (
  meetingRequestId: string
): Promise<ContentConsultationRequestDetailResponse> => {
  const response = await axiosInstance.get<ContentConsultationRequestDetailResponse>(
    `/api/content-consultant/assigned-requests/${meetingRequestId}`
  );
  return response.data;
};

export interface SubmitConsultationRequest {
  feasibility_answer: boolean;
  consultation_answers: string;
}

export const submitConsultation = async (
  consultationId: string,
  data: SubmitConsultationRequest
): Promise<void> => {
  await axiosInstance.post(
    `/api/content-consultant/consultations/${consultationId}/respond`,
    data
  );
};

export const completeConsultation = async (
  consultationId: string
): Promise<void> => {
  await axiosInstance.post(
    `/api/content-consultant/consultations/${consultationId}/complete`
  );
};


