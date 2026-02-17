// Import axios instance - using relative path since @auth doesn't export it
import axiosInstance from '../../auth/utils/axios';
import { MeetingStatus } from '@shared/types';

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

export interface AssigneeSection {
  user_id: string;
  assignee_name: string;
  responded_at: string | null;
  status: string;
  answers: string[];
  assignee_role: string | null;
  consultation_record_number: string;
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
  /** When set, this attachment is a new version replacing another; enables compare. */
  replaces_attachment_id?: string | null;
}

export interface TimeSlot {
  id: string;
  slot_start: string;
  slot_end?: string | null;
  is_available?: boolean;
  is_selected?: boolean;
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

export interface GeneralNoteItem {
  id: string;
  note_type: string;
  text: string;
  author_id: string;
  author_type: string;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingApiResponse {
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
  submitter_name: string;
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
  meeting_owner_name: string;
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
  selected_time_slot?: TimeSlot | null;
  alternative_time_slot_1?: TimeSlot | null;
  alternative_time_slot_2?: TimeSlot | null;
  objectives: Objective[];
  agenda_items: AgendaItem[];
  minister_support: MinisterSupport[];
  minister_attendees?: MinisterAttendee[];
  attachments: Attachment[];
  invitees: Invitee[];
  related_directive_ids: string[];
  related_guidance: string | null;
  /** API returns array of note objects; legacy may be string */
  general_notes: GeneralNoteItem[] | string | null;
  content_officer_notes: string | null;
  /** Executive summary text; attachments with is_executive_summary may also carry the summary */
  executive_summary?: string | null;
  meeting_justification: string;
  related_topic: string | null;
  deadline: string | null;
  meeting_classification_type: string;
  meeting_confidentiality: string;
  sector: string;
}

export interface MeetingsListResponse {
  items: MeetingApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetMeetingsParams {
  status?: MeetingStatus | string;
  skip?: number;
  limit?: number;
  search?: string;
  owner_type?: string;
  start_date?: string; // ISO date string for date range filtering
  end_date?: string; // ISO date string for date range filtering
}

export const getMeetings = async (params: GetMeetingsParams = {}): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.owner_type) {
    queryParams.append('owner_type', params.owner_type);
  }
  if (params.start_date) {
    queryParams.append('start_date', params.start_date);
  }
  if (params.end_date) {
    queryParams.append('end_date', params.end_date);
  }

  const response = await axiosInstance.get<MeetingsListResponse>(`/api/meetings?${queryParams.toString()}`);
  return response.data;
};

// Fetch assigned scheduling requests (for "الاجتماعات السابقة" view)
export const getAssignedSchedulingRequests = async (params: GetMeetingsParams = {}): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  const response = await axiosInstance.get<MeetingsListResponse>(`/api/scheduling/assigned-requests?${queryParams.toString()}`);
  return response.data;
};

// Fetch waiting list items (for "قائمة الانتظار" view)
export const getWaitingList = async (params: GetMeetingsParams = {}): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  const response = await axiosInstance.get<MeetingsListResponse>(`/api/scheduling/waiting-list?${queryParams.toString()}`);
  return response.data;
};

export const getMeetingById = async (meetingId: string): Promise<MeetingApiResponse> => {
  const response = await axiosInstance.get<MeetingApiResponse>(`/api/meetings/${meetingId}`);
  return response.data;
};

/** Meeting search result from /api/v1/business-cards/meetings-search */
export interface MeetingSearchResult {
  id: number;
  uep_id: string;
  adam_id: string;
  original_title: string;
  meeting_title: string;
  group_id: number;
}

/** Search meetings by original_title */
export interface SearchMeetingsParams {
  q: string; // Search query (minLength: 1)
  limit?: number; // Default: 20, min: 1, max: 100
}

export const searchMeetings = async (params: SearchMeetingsParams): Promise<MeetingSearchResult[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('q', params.q);
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  const response = await axiosInstance.get<MeetingSearchResult[]>(`/api/v1/business-cards/meetings-search?${queryParams.toString()}`);
  return response.data;
};

export interface RejectMeetingRequest {
  reason: string;
  notes: string;
}

export const rejectMeeting = async (meetingId: string, payload: RejectMeetingRequest): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/reject`, payload);
};

export const moveToWaitingList = async (meetingId: string): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/add-to-waiting-list`);
};

export interface SendToContentRequest {
  notes: string;
  is_draft?: boolean;
}

export const sendToContent = async (meetingId: string, payload: SendToContentRequest): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/send-to-content`, payload);
};

export interface RequestGuidanceRequest {
  notes: string;
  is_draft?: boolean;
}

export const requestGuidance = async (meetingId: string, payload: RequestGuidanceRequest): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/request-guidance`, payload);
};

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
}

export interface GetConsultantsParams {
  search?: string;
  role_id?: string;
  role_code?: string;
  page?: number;
  limit?: number;
}

export const getConsultants = async (params: GetConsultantsParams = {}): Promise<ConsultantsResponse> => {
  const queryParams = new URLSearchParams();

  if (params.search !== undefined) {
    queryParams.append('search', params.search);
  }
  if (params.role_id) {
    queryParams.append('role_id', params.role_id);
  }
  if (params.role_code) {
    queryParams.append('role_code', params.role_code);
  }
  if (params.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await axiosInstance.get<ConsultantsResponse>(`/api/meeting-requests/users?${queryParams.toString()}`);
  return response.data;
};

export interface RequestSchedulingConsultationRequest {
  consultant_user_id: string;
  consultation_question: string;
  is_draft?: boolean;
}

export const requestSchedulingConsultation = async (
  meetingId: string,
  payload: RequestSchedulingConsultationRequest
): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/request-scheduling-consultation`, payload);
};

export interface UpdateMeetingRequestPayload {
  meeting_title?: string;
  meeting_subject?: string;
  meeting_classification?: string;
  meeting_classification_type?: string;
  meeting_confidentiality?: string;
  meeting_justification?: string;
  related_topic?: string | null;
  deadline?: string | null;
  sector?: string;
  presentation_duration?: number;
  requires_protocol?: boolean;
  protocol_type?: string | null;
  meeting_channel?: string;
  is_data_complete?: boolean;
  selected_time_slot_id?: string | null;
  alternative_time_slot_id_1?: string | null;
  alternative_time_slot_id_2?: string | null;
  scheduled_at?: string | null;
  objectives?: Array<{ objective: string }>;
  agenda_items?: Array<{ agenda_item: string; presentation_duration_minutes?: number }>;
  minister_support?: Array<{ support_description: string }>;
  /** قائمة المدعوين (مقدّم الطلب) – full list when updating */
  invitees?: Array<{
    id?: string;
    user_id?: string | null;
    external_email?: string | null;
    external_name?: string | null;
    position?: string | null;
    mobile?: string | null;
    item_number?: number;
    attendance_mechanism?: string | null;
    is_required?: boolean;
    response_status?: string | null;
    attendee_source?: string | null;
    justification?: string | null;
    access_permission?: string | null;
  }>;
  minister_attendees?: Array<any>;
  related_directive_ids?: string[];
  general_notes?: string | null;
  content_officer_notes?: string | null;
  /** مالك الاجتماع – editable in meeting-info tab */
  meeting_owner?: string;
  is_sequential?: boolean;
  previous_meeting_id?: string | null;
  is_based_on_directive?: boolean;
  directive_method?: string | null;
  previous_meeting_minutes_id?: string | null;
  related_guidance?: string | null;
}

export const updateMeetingRequest = async (
  meetingId: string,
  payload: UpdateMeetingRequestPayload
): Promise<void> => {
  await axiosInstance.put(`/api/meeting-requests/${meetingId}/update`, payload);
};

/**
 * Update meeting request with presentation files only (FormData multipart).
 * Sends only presentation_files; no payload field.
 */
export const updateMeetingRequestWithAttachments = async (
  meetingId: string,
  presentationFiles: File[]
): Promise<void> => {
  const formData = new FormData();
  presentationFiles.forEach((file) => {
    formData.append('presentation_files', file, file.name || undefined);
  });
  await axiosInstance.put(`/api/meeting-requests/${meetingId}/update`, formData);
};

export interface ReturnForInfoRequest {
  notes: string;
  /** Field names the submitter is allowed to edit when request is returned for info */
  editable_fields?: string[];
}

export const returnMeetingForInfo = async (
  meetingId: string,
  payload: ReturnForInfoRequest
): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/return-for-info`, payload);
};

export interface MinisterAttendee {
  username?: string;
  external_email?: string;
  external_name?: string;
  is_required: boolean;
  justification: string;
  access_permission: string;
  position?: string;
  phone?: string;
  attendance_channel?: 'PHYSICAL' | 'REMOTE';
}

export interface ScheduleMeetingRequest {
  scheduled_at: string;
  meeting_channel: string;
  requires_protocol: boolean;
  protocol_type: string | null;
  is_data_complete: boolean;
  notes: string;
  location?: string;
  meeting_link?: string;
  minister_attendees: MinisterAttendee[];
}

export const scheduleMeeting = async (
  meetingId: string,
  payload: ScheduleMeetingRequest
): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/schedule`, payload);
};

/** Reschedule an already scheduled meeting (status SCHEDULED). Uses same payload as schedule. */
export const rescheduleMeeting = async (
  meetingId: string,
  payload: ScheduleMeetingRequest
): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/reschedule`, payload);
};

// Webex Meeting API
export interface CreateWebexMeetingRequest {
  meeting_title: string;
  start_datetime: string; // Format: "2026-01-29 14:43:44"
  time_zone: string; // e.g., "UTC"
  duration_minutes: number;
}

export interface WebexMeetingAccessDetails {
  meeting_number: string;
  password: string;
  sip_address: string;
  host_key: string;
}

export interface CreateWebexMeetingResponse {
  success: boolean;
  message: string;
  document_id: string;
  data: {
    webex_meeting_join_link: string;
    webex_meeting_unique_identifier: string;
    meeting_access_details: WebexMeetingAccessDetails;
  };
}

export const createWebexMeeting = async (
  payload: CreateWebexMeetingRequest
): Promise<CreateWebexMeetingResponse> => {
  const response = await axiosInstance.post<CreateWebexMeetingResponse>(
    '/api/v1/webex/meetings',
    payload
  );
  return response.data;
};

// Directives API
export interface DirectiveResponsiblePerson {
  id: string;
  name: string;
  position: string | null;
}

export interface Directive {
  id: string;
  directive_number: string;
  directive_date: string;
  directive_text: string;
  related_meeting: string;
  deadline: string | null;
  responsible_persons: DirectiveResponsiblePerson[];
  directive_status: string;
  related_meeting_request_id: string | null;
}

export interface DirectivesListResponse {
  items: Directive[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GetDirectivesParams {
  skip?: number;
  limit?: number;
}

export const getDirectives = async (params: GetDirectivesParams = {}): Promise<DirectivesListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await axiosInstance.get<DirectivesListResponse>(`/api/scheduling/directives/current?${queryParams.toString()}`);
  return response.data;
};

export const getPreviousDirectives = async (params: GetDirectivesParams = {}): Promise<DirectivesListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  const response = await axiosInstance.get<DirectivesListResponse>(`/api/scheduling/directives/previous?${queryParams.toString()}`);
  return response.data;
};

export const closeDirective = async (directiveId: string): Promise<void> => {
  await axiosInstance.post(`/api/scheduling/directives/${directiveId}/close`);
};

export const cancelDirective = async (directiveId: string): Promise<void> => {
  await axiosInstance.post(`/api/scheduling/directives/${directiveId}/cancel`);
};

// Consultation Records API

/** New format: individual answer within an assignee */
export interface ConsultationAssigneeAnswer {
  answer_id: string;
  text: string;
  responded_at: string | null;
}

/** New format: assignee with nested answers */
export interface ConsultationAssignee {
  user_id: string;
  name: string;
  role: string | null;
  status: string;
  responded_at: string | null;
  request_number: string | null;
  answers: ConsultationAssigneeAnswer[];
}

/** Old format answer (backward compatibility) */
export interface ConsultationAnswer {
  consultation_id: string;
  consultation_answer: string;
  responded_at: string;
  status: string;
  is_draft: boolean;
  external_id: string | null;
}

export interface ConsultationRecord {
  // New format fields
  id?: string;
  type?: string;
  question?: string;
  round_number?: number;
  assignees?: ConsultationAssignee[];

  // Old format fields (backward compatibility)
  consultation_id?: string;
  consultation_type?: string;
  consultation_question?: string;
  consultant_user_id?: string;
  consultant_name?: string;
  requested_at: string;
  assignee_sections?: AssigneeSection[];
  consultation_answers?: ConsultationAnswer[];
  /** @deprecated Use consultation_answers[0] - kept for backward compatibility */
  consultation_answer?: string | null;
  /** @deprecated Use consultation_answers[0].responded_at */
  responded_at?: string | null;
  status?: string;
  consultation_request_number?: string;
  is_draft?: boolean;
}

export interface ConsultationRecordsResponse {
  items: ConsultationRecord[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export const getConsultationRecords = async (meetingId: string, withDrafts?: boolean): Promise<ConsultationRecordsResponse> => {
  const url = withDrafts === undefined
    ? `/api/meeting-requests/${meetingId}/consultation-record`
    : `/api/meeting-requests/${meetingId}/consultation-record?with_drafts=${withDrafts}`;
  const response = await axiosInstance.get<ConsultationRecordsResponse>(url);
  return response.data;
};

export interface GetConsultationRecordsParams {
  consultation_type?: string;
  include_drafts?: boolean;
  skip?: number;
  limit?: number;
}

export const getConsultationRecordsWithParams = async (
  meetingId: string,
  params: GetConsultationRecordsParams = {}
): Promise<ConsultationRecordsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.consultation_type) {
    queryParams.append('consultation_type', params.consultation_type);
  }
  if (params.include_drafts !== undefined) {
    queryParams.append('include_drafts', params.include_drafts.toString());
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await axiosInstance.get<ConsultationRecordsResponse>(
    `/api/meeting-requests/${meetingId}/consultation-record?${queryParams.toString()}`
  );
  return response.data;
};

// Guidance Records API
export interface GuidanceRecord {
  guidance_id: string;
  guidance_question: string;
  guidance_answer: string | null;
  requested_by_user_id: string;
  requested_by_name: string;
  responded_by_user_id: string | null;
  responded_by_name: string | null;
  requested_at: string;
  responded_at: string | null;
  status: string;
  is_draft: boolean;
}

export interface GuidanceRecordsResponse {
  items: GuidanceRecord[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export const getGuidanceRecords = async (meetingId: string, withDrafts?: boolean): Promise<GuidanceRecordsResponse> => {
  const url = withDrafts === undefined
    ? `/api/meeting-requests/${meetingId}/guidance-record`
    : `/api/meeting-requests/${meetingId}/guidance-record?with_drafts=${withDrafts}`;
  const response = await axiosInstance.get<GuidanceRecordsResponse>(url);
  return response.data;
};

// Content Officer Notes Records API
export interface ContentOfficerNoteRecord {
  id: string;
  note_type?: string;
  text?: string;
  author_id?: string;
  author_type?: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  // Legacy fields (for backward compatibility)
  note_id?: string;
  note_question?: string | null;
  note_answer?: string;
  author_user_id?: string;
}

export interface ContentOfficerNotesRecordsResponse {
  items: ContentOfficerNoteRecord[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GetContentOfficerNotesParams {
  skip?: number;
  limit?: number;
}

export const getContentOfficerNotesRecords = async (
  meetingId: string,
  params: GetContentOfficerNotesParams = {}
): Promise<ContentOfficerNotesRecordsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await axiosInstance.get<ContentOfficerNotesRecordsResponse>(
    `/api/meeting-requests/${meetingId}/content-officer-notes-record?${queryParams.toString()}`
  );
  return response.data;
};

// Evaluate Readiness API
export interface EvaluateReadinessResponse {
  readiness: string;
  reasoning: string[];
}

export const evaluateReadiness = async (meetingId: string): Promise<EvaluateReadinessResponse> => {
  const response = await axiosInstance.post<EvaluateReadinessResponse>(
    `/api/meetings/${meetingId}/evaluate-readiness`
  );
  return response.data;
};

// Compare presentations (تقييم الاختلاف بين العروض)
export interface ComparePresentationsSummary {
  total_slides_original: number;
  total_slides_new: number;
  slide_count_difference: number;
  unchanged_slides: number;
  minor_changes: number;
  moderate_changes: number;
  major_changes: number;
  new_slides: number;
}

export interface ComparePresentationsResponse {
  comparison_id: string;
  overall_score: number;
  difference_level: string;
  status: string;
  regeneration_recommendation: string;
  summary: ComparePresentationsSummary;
  slide_by_slide?: Record<string, unknown>[];
  regeneration_decision?: Record<string, unknown>;
  ai_insights?: Record<string, unknown>;
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