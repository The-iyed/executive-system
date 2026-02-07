// Import axios instance
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

export interface ContentRequestApiResponse {
  id: string;
  request_number: string;
  status: string;
  current_owner_type: string;
  current_owner_user_id: string;
  current_owner_role_id: string;
  submitter_id: string;
  submitter_name: string | null;
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
  attachments?: Attachment[];
}

export interface ContentRequestsListResponse {
  items: ContentRequestApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetContentRequestsParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export const getAssignedContentRequests = async (
  params: GetContentRequestsParams = {}
): Promise<ContentRequestsListResponse> => {
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

  const response = await axiosInstance.get<ContentRequestsListResponse>(
    `/api/content/assigned-requests?${queryParams.toString()}`
  );
  return response.data;
};

// Content Request Detail Types
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

export interface ContentRequestDetailResponse {
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
  selected_time_slot_id: string | null;
  alternative_time_slot_id_1: string | null;
  alternative_time_slot_id_2: string | null;
  selected_time_slot: any | null;
  alternative_time_slot_1: any | null;
  alternative_time_slot_2: any | null;
  objectives: Objective[];
  agenda_items: AgendaItem[];
  minister_support: MinisterSupport[];
  attachments: Attachment[];
  invitees: Invitee[];
  minister_attendees: Invitee[] | null;
  related_directive_ids: string[];
  related_guidance: string | null;
  general_notes: string | null;
  content_officer_notes: string | null;
  meeting_justification: string | null;
  related_topic: string | null;
  deadline: string | null;
  meeting_classification_type: string;
  meeting_confidentiality: string;
  sector: string;
}

export const getContentRequestById = async (
  meetingRequestId: string
): Promise<ContentRequestDetailResponse> => {
  const response = await axiosInstance.get<ContentRequestDetailResponse>(
    `/api/content/assigned-requests/${meetingRequestId}`
  );
  return response.data;
};

export interface SubmitContentReturnRequest {
  content_notes: string;
}

export const submitContentReturn = async (
  meetingRequestId: string,
  data: SubmitContentReturnRequest
): Promise<void> => {
  await axiosInstance.post(
    `/api/content/${meetingRequestId}/return`,
    data
  );
};

export interface SubmitContentConsultationRequest {
  consultant_user_id: string;
  consultation_question: string;
  is_draft?: boolean;
}

export const submitContentConsultation = async (
  meetingRequestId: string,
  data: SubmitContentConsultationRequest
): Promise<void> => {
  await axiosInstance.post(
    `/api/content/${meetingRequestId}/request-consultation`,
    data
  );
};

export const completeContentConsultation = async (
  meetingRequestId: string,
  consultationId: string
): Promise<void> => {
  await axiosInstance.post(
    `/api/content/${meetingRequestId}/request-consultation/${consultationId}/complete`
  );
};

// Consultant types and API
export interface ConsultantUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_ids: string[];
  permission_ids: string[];
  is_active: boolean;
}

export interface ConsultantsResponse {
  items: ConsultantUser[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GetConsultantsParams {
  search?: string;
  role_code?: string;
  user_code?: string;
  skip?: number;
  limit?: number;
}

export const getContentConsultants = async (
  params: GetConsultantsParams = {}
): Promise<ConsultantsResponse> => {
  const queryParams = new URLSearchParams();

  if (params.search !== undefined) {
    queryParams.append('search', params.search || '');
  }
  // Always append role_code (even if empty)
  queryParams.append('role_code', params.role_code || '');
  // Always append user_code (even if empty)
  queryParams.append('user_code', params.user_code || '');
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await axiosInstance.get<ConsultantsResponse>(
    `/api/meeting-requests/users?${queryParams.toString()}`
  );
  return response.data;
};

export interface ApproveContentRequest {
  file?: File;
  notes?: string;
}

export const approveContent = async (
  meetingRequestId: string,
  data: ApproveContentRequest
): Promise<void> => {
  const formData = new FormData();

  if (data.file) {
    formData.append('file', data.file);
  }

  if (data.notes) {
    formData.append('notes', data.notes);
  }

  await axiosInstance.post(
    `/api/content/${meetingRequestId}/approve`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};
export interface ComparisonSummary {
  total_slides_original: number;
  total_slides_new: number;
  slide_count_difference: number;
  unchanged_slides: number;
  minor_changes: number;
  moderate_changes: number;
  major_changes: number;
  new_slides: number;
}

export interface CompareConsultantStatementsResponse {
  comparison_id: string;
  overall_score: number;
  difference_level: string;
  status: string;
  regeneration_recommendation: string;
  summary: ComparisonSummary;
  slide_by_slide?: Record<string, unknown>[];
  regeneration_decision?: Record<string, unknown>;
  ai_insights?: Record<string, unknown>;
}

export const compareConsultantStatements = async (
  meetingId: string
): Promise<CompareConsultantStatementsResponse> => {
  const response = await axiosInstance.post<CompareConsultantStatementsResponse>(
    '/api/comparisons/compare',
    { meeting_id: meetingId }
  );
  return response.data;
};

// LLM notes/insights for an attachment (presentation)
export interface AttachmentInsightsResponse {
  attachment_id: string;
  presentation_id: string;
  extraction_status: string;
  llm_processing_status: string;
  llm_notes?: string[];
  llm_suggestions?: string[];
}

export const getAttachmentInsights = async (
  attachmentId: string
): Promise<AttachmentInsightsResponse> => {
  const response = await axiosInstance.get<AttachmentInsightsResponse>(
    `/api/presentations/by-attachment/${attachmentId}/insights`
  );
  return response.data;
};

// Analyze contradictions between consultant statements
export interface AnalyzeContradiction {
  statements: string[];
  severity: string;
  comment: string;
}

export interface AnalyzeCategory {
  category_name: string;
  statements: string[];
  contradictions: AnalyzeContradiction[];
}

export interface AnalyzeResponse {
  categories: AnalyzeCategory[];
}

const ANALYZE_ENDPOINT = 'https://text-contradiction-detector.momrahai.com/analyze';

export const analyzeContradictions = async (sentences: string[]): Promise<AnalyzeResponse> => {
  const response = await axiosInstance.post<AnalyzeResponse>(ANALYZE_ENDPOINT, { sentences });
  return response.data;
};

