// Import axios instance
import { TableRow } from '@/lib/dynamic-table-form';
import axiosInstance from '../../auth/utils/axios';

export interface Objective {
  id: string;
  objective: string;
}

export interface AgendaItem {
  id: string;
  agenda_item: string;
  presentation_duration_minutes: number;
}

export interface MinisterSupport {
  id: string;
  support_description: string;
}

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

export interface Invitee {
  id: string;
  user_id: string | null;
  external_email: string | null;
  external_name: string | null;
  is_required: boolean;
  response_status: string;
  attendee_source: string;
  justification: string | null;
  access_permission: string | null;
}

export interface ConsultationRequestApiResponse {
  id: string;
  request_number: string;
  status: string;
  current_owner_type: string;
  current_owner_user_id: string;
  current_owner_role_id: string;
  current_owner_user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  current_owner_role: {
    id: string;
    code: string;
    name: string;
    name_ar: string;
  } | null;
  submitter_id: string;
  submitter_name: string | null;
  submitter?: Record<string, unknown> | string | null;
  submitter_job_title: string | null;
  submitter_sector: string | null;
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
  selected_time_slot_id?: string | null;
  alternative_time_slot_id_1?: string | null;
  alternative_time_slot_id_2?: string | null;
  selected_time_slot?: any | null;
  alternative_time_slot_1?: any | null;
  alternative_time_slot_2?: any | null;
  objectives?: Objective[];
  agenda_items?: AgendaItem[];
  minister_support?: MinisterSupport[];
  attachments?: Attachment[];
  invitees?: TableRow[];
  minister_attendees?: Invitee[];
  related_directive_ids?: string[];
  related_guidance?: string | null;
  general_notes?: string | string[] | null;
  content_officer_notes?: string | null;
  meeting_justification?: string;
  related_topic?: string | null;
  deadline?: string | null;
  meeting_classification_type?: string;
  meeting_confidentiality?: string;
  sector?: string;
  presentation_attachment_timing?: string | null;
  is_on_behalf_of?: boolean;
  is_urgent?: boolean;
  urgent_reason?: string | null;
  directive_method?: string | null;
  location?: string | null;
}

export interface ConsultationsListResponse {
  items: ConsultationRequestApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetConsultationRequestsParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export const getAssignedConsultationRequests = async (
  params: GetConsultationRequestsParams = {}
): Promise<ConsultationsListResponse> => {
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

  const response = await axiosInstance.get<ConsultationsListResponse>(
    `/api/consultations/my-meetings?${queryParams.toString()}`
  );
  return response.data;
};

export interface ConsultationRequestDetailResponse {
  meeting_request: ConsultationRequestApiResponse;
  consultation_question: string;
}

export const getConsultationRequestById = async (
  meetingRequestId: string
): Promise<ConsultationRequestDetailResponse> => {
  const response = await axiosInstance.get<ConsultationRequestDetailResponse>(
    `/api/consultations/assigned-requests/${meetingRequestId}`
  );
  return response.data;
};

export interface SubmitConsultationRequest {
  feasibility_answer: boolean;
  /** Sent as consultation_answers to API (user response text) */
  consultation_answers: string;
}

export const submitConsultationResponse = async (
  consultationId: string,
  data: SubmitConsultationRequest
): Promise<void> => {
  await axiosInstance.post(
    `/api/consultations/${consultationId}/respond`,
    data
  );
};

export const saveConsultationAsDraft = async (
  consultationId: string,
  data: SubmitConsultationRequest
): Promise<void> => {
  await axiosInstance.put(
    `/api/consultations/${consultationId}`,
    data
  );
};

export interface PendingConsultation {
  id: string;
  meeting_request_id: string;
  consultation_type: string;
  consultant_user_id: string;
  status: string;
  feasibility_answer: boolean | null;
  recommendation: string | null;
  consultation_notes: string | null;
  /** Question text to show in تقديم استشارة tab (from pending API) */
  consultation_question?: string | null;
  requested_at: string;
  responded_at: string | null;
  content_exception: string | null;
  duration_granted: number | null;
}

export const getPendingConsultations = async (
  meetingId: string
): Promise<PendingConsultation> => {
  const response = await axiosInstance.get<PendingConsultation>(
    `/api/meeting-requests/${meetingId}/consultations/pending`
  );
  return response.data;
};
