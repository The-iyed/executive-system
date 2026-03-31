// Import axios instance
import { TableRow } from '@/lib/dynamic-table-form';
import axiosInstance from '../../auth/utils/axios';
import { EXECUTION_SYSTEM_BASE_URL, TEXT_CONTRADICTION_DETECTOR_URL } from '@/lib/env';

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
  /** When set, this attachment is a new version replacing another; used to enable compare. */
  replaces_attachment_id?: string | null;
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
  invitees: TableRow[];
  minister_attendees: Invitee[] | null;
  related_directive_ids: string[];
  /** When present, full directive objects for table display (like meeting detail). */
  related_directives?: import('../../shared/types/meeting').RelatedDirective[];
  related_guidance: string | null;
  general_notes: string | null;
  content_officer_notes: string | null;
  /** Scheduler's note specifically for content review tab. */
  scheduling_officer_note_for_content?: string | null;
  meeting_justification: string | null;
  related_topic: string | null;
  deadline: string | null;
  meeting_classification_type: string;
  meeting_confidentiality: string;
  sector: string;
  /** When present, AI suggestion button is shown; when missing, it is hidden. */
  ext_id?: number | string | null;
  /** When present, used to fetch suggested-actions (execution-system meeting id). Matches GET /api/content/assigned-requests/:id response. */
  meeting_id?: string | null;
  /** When present, linked meeting from execution-system; use meeting.id or meeting.meeting_id for suggested-actions. */
  meeting?: { id?: string; meeting_id?: string } | null;
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

/** Action item from GET /api/v1/actions/ (list actions). */
export interface ActionItem {
  id: number;
  adam_id?: string | null;
  title: string;
  due_date?: string | null;
  status?: string;
  is_completed?: boolean;
  meeting_id?: number | string | null;
  created_date?: string | null;
  mod_date?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  /** Array of assignee emails – do not treat as string. */
  assignees?: string[];
}

export interface ListActionsParams {
  limit?: number;
  skip?: number;
  search?: string;
}

/** GET /api/v1/actions/ – list actions with optional search and limit (uses business-cards base URL). */
export const listActions = async (
  params: ListActionsParams = {}
): Promise<ActionItem[]> => {
  const parts: string[] = [];
  if (params.limit !== undefined) {
    parts.push(`limit=${encodeURIComponent(String(params.limit))}`);
  }
  if (params.search != null && params.search !== '') {
    parts.push(`search=${encodeURIComponent(params.search)}`);
  }
  const query = parts.length > 0 ? `?${parts.join('&')}` : '';
  const url = `/api/v1/actions${query}`;
  const response = await axiosInstance.get<ActionItem[]>(url);
  const data = response.data;
  return Array.isArray(data) ? data : [];
};

/** Directive object for approve payload – directives form field is JSON string of this array. */
export interface DirectiveForApprove {
  id: number;
  title: string;
  due_date: string | null;
  assignees: string[];
  status: string;
}

export interface ApproveContentRequest {
  file?: File;
  notes?: string;
  /** Array of directive objects (sent as JSON string in form). */
  directives?: DirectiveForApprove[];
}

export const approveContent = async (
  meetingRequestId: string,
  data: ApproveContentRequest
): Promise<void> => {
  const formData = new FormData();

  if (data.file) {
    formData.append('file', data.file);
  }

  if (data.notes !== undefined && data.notes !== null) {
    formData.append('notes', typeof data.notes === 'string' ? data.notes : '');
  }

  if (data.directives && data.directives.length > 0) {
    formData.append('directives', JSON.stringify(data.directives));
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

export interface CompareSlideBySlideItem {
  slide_number: number;
  details: string;
  change_level: string;
}

export interface CompareRegenerationDecision {
  recommendation: string;
  confidence: string;
  reasoning: string;
  key_factors?: string[];
  business_impact?: string;
  risk_assessment?: string;
  presentation_coherence?: string;
}

export interface CompareAiInsights {
  main_topics?: string[];
  business_impact?: string;
  risk_assessment?: string;
  presentation_coherence?: string;
  slide_count_comparison?: {
    original_count: number;
    new_count: number;
    difference: number;
  };
}

export interface ComparePresentationsResponse {
  comparison_id: string;
  overall_score: number;
  difference_level: string;
  status: string;
  regeneration_recommendation: string;
  summary: ComparisonSummary;
  slide_by_slide: CompareSlideBySlideItem[];
  regeneration_decision?: CompareRegenerationDecision;
  ai_insights?: CompareAiInsights;
}

/** POST compare-by-attachment response. When status is "completed", full result is fetched via GET. */
export interface CompareByAttachmentPostResponse {
  comparison_id: string;
  status: string;
  created_at?: string;
  completed_at?: string;
  is_new?: boolean;
  task_id?: string | null;
}

/** POST /api/comparisons/compare-by-attachment/{attachment_id}. Returns status (completed | pending). */
export const postCompareByAttachment = async (
  attachmentId: string
): Promise<CompareByAttachmentPostResponse> => {
  const response = await axiosInstance.post<CompareByAttachmentPostResponse>(
    `/api/comparisons/compare-by-attachment/${attachmentId}`
  );
  return response.data;
};

/** GET /api/comparisons/by-attachment/{attachment_id} response: wrapper with nested result. */
export interface GetComparisonByAttachmentResponse {
  comparison_id: string;
  status: string;
  created_at?: string;
  completed_at?: string;
  result: ComparePresentationsResponse;
}

/** GET /api/comparisons/by-attachment/{attachment_id}. Returns the inner result for display (POST is only for status). */
export const getComparisonByAttachment = async (
  attachmentId: string
): Promise<ComparePresentationsResponse> => {
  const response = await axiosInstance.get<GetComparisonByAttachmentResponse>(
    `/api/comparisons/by-attachment/${attachmentId}`
  );
  return response.data.result;
};

const DEFAULT_POLL_INTERVAL_MS = 2000;

/** Run full compare: POST for status only. If completed → GET and return result. If pending → poll POST, then GET result. */
export const runCompareByAttachment = async (
  attachmentId: string,
  options?: { pollIntervalMs?: number }
): Promise<ComparePresentationsResponse> => {
  const intervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  const pollPost = async (): Promise<void> => {
    const data = await postCompareByAttachment(attachmentId);
    if (data.status === 'completed') {
      return;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    await pollPost();
  };

  await pollPost();
  return getComparisonByAttachment(attachmentId);
};

// LLM notes/insights for an attachment (presentation) – تقييم الاختلاف بين العروض
const INSIGHTS_API_BASE = EXECUTION_SYSTEM_BASE_URL;

export interface AttachmentInsightsResponse {
  attachment_id: string;
  presentation_id: string;
  extraction_status: string;
  llm_processing_status: string;
  llm_notes?: string[];
  llm_suggestions?: string[];
}

/** GET presentations/by-attachment/{id}/insights from execution-system (تقييم الاختلاف بين العروض). */
export const getAttachmentInsights = async (
  attachmentId: string
): Promise<AttachmentInsightsResponse> => {
  const base = INSIGHTS_API_BASE.endsWith('/') ? INSIGHTS_API_BASE : `${INSIGHTS_API_BASE}/`;
  const url = `${base}api/presentations/by-attachment/${attachmentId}/insights`;
  const response = await axiosInstance.get<AttachmentInsightsResponse>(url);
  return response.data;
};

const INSIGHTS_POLL_INTERVAL_MS = 2000;
const INSIGHTS_MAX_POLL_ATTEMPTS = 60;

function isInsightsReady(data: AttachmentInsightsResponse): boolean {
  const extDone = (data.extraction_status || '').toLowerCase() === 'completed';
  const llmDone = (data.llm_processing_status || '').toLowerCase() === 'completed';
  // Only consider ready when both are completed so we get the full response (llm_notes + llm_suggestions)
  return extDone && llmDone;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/** Poll GET insights until ready (same as meeting detail). */
export const getAttachmentInsightsWithPolling = async (
  attachmentId: string,
  options?: { pollIntervalMs?: number; maxAttempts?: number; signal?: AbortSignal }
): Promise<AttachmentInsightsResponse> => {
  const intervalMs = options?.pollIntervalMs ?? INSIGHTS_POLL_INTERVAL_MS;
  const maxAttempts = options?.maxAttempts ?? INSIGHTS_MAX_POLL_ATTEMPTS;
  const signal = options?.signal;

  let lastData = await getAttachmentInsights(attachmentId);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (isInsightsReady(lastData)) return lastData;
    await delay(intervalMs, signal);
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    lastData = await getAttachmentInsights(attachmentId);
  }
  return lastData;
};

// Analyze contradictions between consultant statements
// UI only uses contradictions (not statements).
export interface AnalyzeContradiction {
  statements: string[];
  severity: string;
  comment: string;
}

export interface AnalyzeCategory {
  category_name: string;
  statements?: string[]; // not used in UI
  contradictions: (string | AnalyzeContradiction)[];
}

export interface AnalyzeResponse {
  categories: AnalyzeCategory[];
}

const ANALYZE_ENDPOINT = `${TEXT_CONTRADICTION_DETECTOR_URL}/analyze`;

export const analyzeContradictions = async (sentences: string[]): Promise<AnalyzeResponse> => {
  const response = await axiosInstance.post<AnalyzeResponse>(ANALYZE_ENDPOINT, { sentences });
  return response.data;
};

// ── Content Directives CRUD ──

export interface ContentDirective {
  id: number;
  title: string;
  due_date: string | null;
  assignees: string[];
  status: string;
}

export type CreateContentDirectivePayload = Omit<ContentDirective, 'id'> & { id?: number };
export type UpdateContentDirectivePayload = Partial<Omit<ContentDirective, 'id'>>;

export const getContentDirectives = async (meetingId: string): Promise<ContentDirective[]> => {
  const response = await axiosInstance.get<ContentDirective[]>(`/api/content/${meetingId}/directives`);
  return Array.isArray(response.data) ? response.data : [];
};

export const createContentDirective = async (
  meetingId: string,
  data: CreateContentDirectivePayload
): Promise<ContentDirective> => {
  const response = await axiosInstance.post<ContentDirective>(`/api/content/${meetingId}/directives`, data);
  return response.data;
};

export const updateContentDirective = async (
  meetingId: string,
  directiveId: number,
  data: UpdateContentDirectivePayload
): Promise<ContentDirective> => {
  const response = await axiosInstance.patch<ContentDirective>(
    `/api/content/${meetingId}/directives/${directiveId}`,
    data
  );
  return response.data;
};

export const deleteContentDirective = async (
  meetingId: string,
  directiveId: number
): Promise<void> => {
  await axiosInstance.delete(`/api/content/${meetingId}/directives/${directiveId}`);
};

