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
  position?: string | null;
  mobile?: string | null;
  attendance_mechanism?: string | null;
  is_required: boolean;
  response_status: string;
  attendee_source: string;
  justification: string | null;
  access_permission: string | null;
}

export interface GuidanceRequestApiResponse {
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
  /** Actual meeting start datetime (prefer over scheduled_at for "time remaining" validation). */
  scheduled_start?: string | null;
  /** Alternative field some endpoints return for meeting start. */
  meeting_start_date?: string | null;
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
  minister_attendees?: Invitee[] | null;
  related_directive_ids?: string[];
  related_guidance?: string | null;
  general_notes?: string | null;
  content_officer_notes?: string | null;
  meeting_justification?: string;
  related_topic?: string | null;
  deadline?: string | null;
  meeting_classification_type?: string;
  meeting_confidentiality?: string;
  sector?: string;
  is_on_behalf_of?: boolean;
  urgent_reason?: string | null;
}

export interface GuidanceRequestsListResponse {
  items: GuidanceRequestApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetGuidanceRequestsParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export const getAssignedGuidanceRequests = async (
  params: GetGuidanceRequestsParams = {}
): Promise<GuidanceRequestsListResponse> => {
  const queryParams = new URLSearchParams();

  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  const response = await axiosInstance.get<GuidanceRequestsListResponse>(
    `/api/guidance/pending-meetings?${queryParams.toString()}`
  );
  return response.data;
};

export const getContentExceptions = async (
  params: GetGuidanceRequestsParams = {}
): Promise<GuidanceRequestsListResponse> => {
  const queryParams = new URLSearchParams();

  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  const response = await axiosInstance.get<GuidanceRequestsListResponse>(
    `/api/guidance/content-exceptions?${queryParams.toString()}`
  );
  return response.data;
};

export interface GuidanceRequestDetailResponse {
  meeting_request: GuidanceRequestApiResponse;
  guidance_question: string | null;
}

export const getGuidanceRequestById = async (
  meetingRequestId: string
): Promise<GuidanceRequestDetailResponse> => {
  const response = await axiosInstance.get<GuidanceRequestDetailResponse>(
    `/api/guidance/assigned-requests/${meetingRequestId}`
  );
  return response.data;
};

export const getContentExceptionById = async (
  meetingRequestId: string
): Promise<GuidanceRequestDetailResponse> => {
  const response = await axiosInstance.get<GuidanceRequestDetailResponse>(
    `/api/guidance/content-exceptions/${meetingRequestId}`
  );
  return response.data;
};

export interface ProvideGuidanceRequest {
  guidance_notes: string;
  feasibility_answer: boolean;
  is_draft: boolean;
}

export const provideGuidance = async (
  meetingRequestId: string,
  data: ProvideGuidanceRequest
): Promise<void> => {
  await axiosInstance.post(
    `/api/guidance/${meetingRequestId}/provide`,
    data
  );
};

export const saveGuidanceAsDraft = async (
  meetingRequestId: string,
  data: ProvideGuidanceRequest
): Promise<void> => {
  await axiosInstance.post(
    `/api/guidance/${meetingRequestId}/provide`,
    {
      ...data,
      is_draft: true,
    }
  );
};

export const completeGuidance = async (
  guidanceId: string
): Promise<void> => {
  await axiosInstance.post(
    `/api/guidance/${guidanceId}/complete`
  );
};

export interface HandleContentExceptionRequest {
  content_exception: boolean;
  granted_duration_hours: number;
}

export const handleContentException = async (
  meetingRequestId: string,
  data: HandleContentExceptionRequest
): Promise<void> => {
  await axiosInstance.post(
    `/api/guidance/content-exceptions/${meetingRequestId}/handle`,
    data
  );
};

