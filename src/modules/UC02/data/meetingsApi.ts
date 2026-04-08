// Import axios instance - using relative path since @auth doesn't export it
import { TableRow } from '@/lib/dynamic-table-form';
import axiosInstance from '../../auth/utils/axios';
import { EXECUTION_SYSTEM_BASE_URL, BUSINESS_CARDS_BASE_URL } from '@/lib/env';
import { toISOStringWithTimezoneFromString } from '@/lib/ui';
import { MeetingStatus } from '@/modules/shared/types';

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
  /** Presentation version order; when > 1, compare button is enabled. */
  presentation_sequence?: number | null;
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

/** Related directive as returned in get meeting details (related_directives). */
export interface RelatedDirective {
  id: string;
  directive_number: string;
  directive_date: string;
  directive_text: string;
  related_meeting: string | null;
  deadline: string | null;
  responsible_persons: Array<{ id: string | null; name: string; position: string | null }>;
  directive_status: string;
  created_at: string;
  created_by: string;
  closed_at: string | null;
  closed_by: string | null;
  related_meeting_request_id: string | null;
  related_meeting_request: string | null;
}

export interface MeetingApiResponse {
  id: string;
  request_number: string;
  status: string;
  current_owner_type: string;
  current_owner_user_id: string;
  /** Owner identifier; prefer over current_owner_user_id when present. */
  current_owner_object_guid?: string;
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
  /** Start of scheduled meeting (API response). */
  scheduled_start?: string | null;
  /** End of scheduled meeting (API response). */
  scheduled_end?: string | null;
  closed_at: string | null;
  version: number;
  meeting_title: string;
  meeting_type: string;
  meeting_subject: string;
  meeting_owner_name: string;
  meeting_classification: string;
  meeting_start_date: string | null;
  presentation_duration: number;
  is_data_complete: boolean;
  requires_protocol: boolean;
  protocol_type: string | null;
  meeting_channel: string;
  is_sequential: boolean;
  sequential_number: number | null;
  previous_meeting_id: string | null;
  /** When present, use meeting_id for value and meeting_title for display in الاجتماع السابق */
  previous_meeting?: {
    item_number?: number;
    meeting_id: string;
    meeting_title?: string | null;
    meeting_date?: string | null;
    meeting?: unknown | null;
  } | null;
  /** Previous meeting from GET meeting details (same as update payload). */
  prev_ext_id?: number | null;
  group_id?: number | null;
  prev_ext_original_title?: string | null;
  prev_ext_meeting_title?: string | null;
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
  invitees: TableRow[];
  related_directive_ids: string[];
  /** Full directive objects returned by get meeting details (when available). */
  related_directives?: RelatedDirective[];
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
  description?: string | null;
  note?: string | null;
  /** Content approval directives (استشارة المحتوى tab). */
  content_approval_directives?: string[];
  /** Previous meeting minutes attachment from GET meeting details (file_name, blob_url, etc.). */
  previous_meeting_attachment?: {
    id?: string;
    meeting_request_id?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    content_type?: string;
    uploaded_by?: string;
    uploaded_at?: string;
    blob_url?: string;
    source?: string;
    name?: string;
  } | null;
  /** When status is REJECTED. */
  rejection_reason?: string | null;
  rejection_note?: string | null;
  /** When status is CANCELLED. */
  cancellation_reason?: string | null;
  cancellation_note?: string | null;
}

export interface MeetingsListResponse {
  items: MeetingApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetMeetingsParams {
  status?: MeetingStatus | string;
  /** Filter by multiple statuses – overrides `status` when provided */
  status_in?: string[];
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
  
  if (params.status_in && params.status_in.length > 0) {
    params.status_in.forEach(s => queryParams.append('status_in', s));
  } else if (params.status) {
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

/** Previous meetings list from execution system (الاجتماعات السابقة tab) */
const EXECUTION_SYSTEM_MEETINGS_URL = `${EXECUTION_SYSTEM_BASE_URL}/api/meetings`;

export const getPreviousMeetingsFromExecutionSystem = async (params: { skip?: number; limit?: number } = {}): Promise<MeetingsListResponse> => {
  const skip = params.skip ?? 0;
  const limit = params.limit ?? 10;
  const url = `${EXECUTION_SYSTEM_MEETINGS_URL}?skip=${skip}&limit=${limit}`;
  const response = await axiosInstance.get<MeetingsListResponse>(url);
  return response.data;
};

export const getMeetingById = async (meetingId: string): Promise<MeetingApiResponse> => {
  const response = await axiosInstance.get<MeetingApiResponse>(`/api/meetings/${meetingId}`);
  const data = response.data;
  if (Array.isArray(data.invitees)) {
    data.invitees = data.invitees.map((inv: any) => {
      const { ...rest } = inv;
      return {
        ...rest,
        is_presence_required: Boolean(inv.is_presence_required),
      };
    });
  }
  return data;
};

/** Fetch meeting request by id (full payload including previous_meeting_attachment). Use for detail page when /api/meetings/:id omits it. */
export const getMeetingRequestById = async (requestId: string): Promise<MeetingApiResponse> => {
  try {
    const response = await axiosInstance.get<MeetingApiResponse>(`/api/meeting-requests/${requestId}`);
    return response.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return getMeetingById(requestId);
    }
    throw err;
  }
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

/**
 * Fetch meetings for "الاجتماع السابق" (previous meeting) dropdown.
 * Uses GET /api/v1/business-cards/meetings-search (no group_id/ext_id here; those are sent on update).
 * Use uep_id as previous_meeting_id value in {meeting_request_id}/update payload.
 */
export interface MeetingsSearchForPreviousParams {
  q?: string;
  skip?: number;
  limit?: number;
}

export interface MeetingsSearchForPreviousResponse {
  items: MeetingSearchResult[];
  total: number;
  skip: number;
  limit: number;
}

export const getMeetingsSearchForPrevious = async (
  params: MeetingsSearchForPreviousParams = {}
): Promise<MeetingsSearchForPreviousResponse> => {
  const skip = params.skip ?? 0;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const queryParams = new URLSearchParams();
  const q = params.q != null && params.q.trim() !== '' ? params.q.trim() : 'a';
  queryParams.set('q', q);
  queryParams.set('skip', String(skip));
  queryParams.set('limit', String(limit));
  const response = await axiosInstance.get<MeetingSearchResult[] | MeetingsSearchForPreviousResponse>(
    `/api/v1/business-cards/meetings-search?${queryParams.toString()}`
  );
  const data = response.data;
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      skip,
      limit,
    };
  }
  return data as MeetingsSearchForPreviousResponse;
};

export interface RejectMeetingRequest {
  reason: string;
  notes: string;
}

export const rejectMeeting = async (meetingId: string, payload: RejectMeetingRequest): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/reject`, payload);
};

export interface CancelMeetingRequest {
  reason?: string;
  notes?: string;
}

export const cancelMeeting = async (meetingId: string, payload: CancelMeetingRequest = {}): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/cancel`, payload);
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
  consultant_user_ids: string[];
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
  meeting_type?: string;
  meeting_subject?: string;
  meeting_classification?: string;
  meeting_classification_type?: string;
  meeting_confidentiality?: string;
  meeting_justification?: string;
  related_topic?: string | null;
  deadline?: string | null;
  sector?: string;
  is_on_behalf_of?: boolean;
  is_urgent?: boolean;
  presentation_duration?: number;
  requires_protocol?: boolean;
  protocol_type?: string | null;
  meeting_channel?: string;
  /** موقع الاجتماع (الموقع) – venue/location text */
  meeting_location?: string | null;
  is_data_complete?: boolean;
  selected_time_slot_id?: string | null;
  alternative_time_slot_id_1?: string | null;
  alternative_time_slot_id_2?: string | null;
  scheduled_at?: string | null;
  objectives?: Array<{ objective: string }>;
  /** Agenda items with minister support inline: agenda_item, presentation_duration_minutes, minister_support_type, minister_support_other (null or text when type is "أخرى"). */
  agenda_items?: Array<{
    agenda_item: string;
    presentation_duration_minutes?: number;
    minister_support_type: string;
    minister_support_other: string | null;
  }>;
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
  is_based_on_directive?: boolean;
  directive_method?: string | null;
  previous_meeting_minutes_id?: string | null;
  related_guidance?: string | null;
  /** Previous meeting from search: id from search result. Sent on update. */
  prev_ext_id?: number;
  /** Previous meeting from search: group_id from search result. Sent on update. */
  group_id?: number;
  /** Selected previous meeting's original_title from search. Sent on update. */
  prev_ext_original_title?: string | null;
  /** Selected previous meeting's meeting_title from search. Sent on update. */
  prev_ext_meeting_title?: string | null;
}

export const updateMeetingRequest = async (
  meetingId: string,
  payload: UpdateMeetingRequestPayload
): Promise<void> => {
  const body = {
    ...payload,
    group_id: payload.group_id ?? 0,
    prev_ext_id: payload.prev_ext_id ?? 0,
  };
  await axiosInstance.put(`/api/meeting-requests/${meetingId}/update`, body);
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
  /** Optional notes for the submitter (مجدول - معلومات إضافية) */
  notes?: string;
  /** Field names the submitter is allowed to edit when request is returned for info */
  editable_fields?: string[];
}

/** مجدول - الجدولة: إعادة – POST /api/meeting-requests/{meeting_id}/return-for-info */
export const returnMeetingForInfo = async (
  meetingId: string,
  payload: ReturnForInfoRequest
): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/return-for-info`, payload);
};

/** مجدول - الجدولة: إعتماد التحديث – POST /api/meeting-requests/{meeting_id}/approve-update */
export interface ApproveUpdateRequest {
  notes?: string;
}

export const approveMeetingUpdate = async (
  meetingId: string,
  payload: ApproveUpdateRequest = {}
): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/approve-update`, payload);
};

/** مجدول - الجدولة: إرسال للمحتوى – POST /api/meeting-requests/{meeting_id}/send-to-content-scheduled */
export interface SendToContentScheduledRequest {
  /** Optional notes / questions for content officer; each line can create a CONTENT consultation */
  notes?: string;
  /** Optional: assign a specific content officer */
  consultant_user_id?: string;
}

export const sendToContentScheduled = async (
  meetingId: string,
  payload: SendToContentScheduledRequest = {}
): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/send-to-content-scheduled`, payload);
};

export interface MinisterAttendee {
  id?: string;
  username?: string;
  external_email?: string;
  external_name?: string;
  is_required: boolean;
  justification: string;
  access_permission: string;
  position?: string;
  /** Form/display field; API may return mobile instead */
  phone?: string;
  /** API response field for phone number */
  mobile?: string;
  attendance_channel?: 'PHYSICAL' | 'REMOTE';
  /** API response field for attendance (e.g. "حضوري", "عن بعد") */
  attendance_mechanism?: string;
  response_status?: string;
  sector?: string | null;
  /** Whether the attendee is a consultant (مستشار). Sent to backend as is_consultant. */
  is_consultant?: boolean;
}

export interface ScheduleMeetingRequest {
  /** ISO datetime string (e.g. 2026-02-17T20:23:44.728Z) */
  scheduled_start: string;
  /** ISO datetime string (e.g. 2026-02-17T21:23:44.728Z) */
  scheduled_end: string;
  meeting_channel: string;
  requires_protocol: boolean;
  /** مبدئي – when true, booking is preliminary */
  is_preliminary_booking?: boolean;
  protocol_type: string | null;
  is_data_complete: boolean;
  notes: string;
  location?: string;
  meeting_url?: string;
  /** From Webex create meeting API response; send whenever meeting_url (Webex link) is sent */
  webex_meeting_unique_identifier?: string;
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

// Directives API – current (matches /scheduling/directives/current)
export interface Directive {
  id: string;
  action_number: string;
  title: string;
  due_date: string;
  status: string;
  is_completed: boolean;
  meeting_id: string | null;
  created_date: string;
  mod_date: string | null;
  completed_at: string | null;
  assignees: string;
}

export interface DirectivesListResponse {
  items: Directive[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

// Previous directives API – raw response from /api/minister-directives?status=ADOPTED
export interface MinisterDirectiveApiItem {
  id: string;
  title: string;
  status: string;
  scheduling_officer_status?: string;
  created_at: string;
  updated_at: string;
  action_number?: string;
  due_date?: string;
  is_completed?: boolean;
  meeting_id?: string | null;
  completed_at?: string | null;
  assignees?: string[];
}

// Normalized previous directive (used by UI and close/cancel payloads)
export interface PreviousDirectiveItem {
  id: string;
  external_id: string;
  action_number: string;
  title: string;
  due_date: string;
  status: string;
  is_completed: boolean;
  meeting_id: string | null;
  created_date: string;
  mod_date: string;
  completed_at: string | null;
  assignees: string[];
}

export interface PreviousDirectivesListResponse {
  items: PreviousDirectiveItem[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

/** Map raw API item to PreviousDirectiveItem (id → external_id for close endpoint) */
function mapMinisterDirectiveToPrevious(item: MinisterDirectiveApiItem): PreviousDirectiveItem {
  const assignees = Array.isArray(item.assignees) ? item.assignees.filter(Boolean) : [];
  return {
    id: item.id,
    external_id: item.id,
    action_number: item.action_number ?? '',
    title: item.title,
    due_date: item.due_date ?? item.updated_at ?? item.created_at,
    status: item.status,
    is_completed: item.is_completed ?? item.status === 'ADOPTED',
    meeting_id: item.meeting_id ?? null,
    created_date: item.created_at,
    mod_date: item.updated_at,
    completed_at: item.completed_at ?? null,
    assignees,
  };
}

export interface GetDirectivesParams {
  skip?: number;
  limit?: number;
  /** Search query – applied by the API, not the frontend */
  search?: string;
}

export const getDirectives = async (params: GetDirectivesParams = {}): Promise<DirectivesListResponse> => {
  const queryParams = new URLSearchParams();

  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search != null && params.search.trim() !== '') {
    queryParams.append('search', params.search.trim());
  }

  queryParams.append('status', 'TAKEN');

  const response = await axiosInstance.get<DirectivesListResponse>(`/api/minister-directives?${queryParams.toString()}`);
  return response.data;
};

interface MinisterDirectivesApiResponse {
  items: MinisterDirectiveApiItem[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export const getPreviousDirectives = async (params: GetDirectivesParams = {}): Promise<PreviousDirectivesListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search != null && params.search.trim() !== '') {
    queryParams.append('search', params.search.trim());
  }

  queryParams.append('status', 'ADOPTED');

  const response = await axiosInstance.get<MinisterDirectivesApiResponse>(`/api/minister-directives?${queryParams.toString()}`);
  return {
    ...response.data,
    items: response.data.items.map(mapMinisterDirectiveToPrevious),
  };
};


/** Request body for POST /api/external-directives (Create/Close/Cancel – same body).
 * Close: external_id required; optional full payload if directive does not exist (create then close).
 */
export interface CreateDirectivePayload {
  /** External system ID (e.g. 214) or internal UUID; API accepts int or str */
  external_id: string | number;
  action_number: string;
  title: string;
  due_date: string; // ISO date-time
  status: string;
  is_completed: boolean;
  meeting_id?: number | null;
  created_date: string; // ISO date-time
  mod_date?: string; // ISO date-time, optional on create
  completed_at?: string | null; // ISO date-time, optional when not completed
  assignees: string[]; // e.g. email addresses
}

/** Parse id to external_id: use number if numeric, else string (e.g. UUID) */
function toExternalId(id: string): string | number {
  const n = Number(id);
  return Number.isFinite(n) ? n : id;
}

/** Build external-directives body from a Directive (for close/cancel or create). */
export const directiveToExternalDirectiveBody = (d: Directive): CreateDirectivePayload => {
  const assigneesArray =
    typeof d.assignees === 'string'
      ? d.assignees
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : Array.isArray(d.assignees)
        ? d.assignees
        : [];
  const meetingId = d.meeting_id != null ? Number(d.meeting_id) : undefined;
  return {
    external_id: toExternalId(d.id),
    action_number: d.action_number,
    title: d.title,
    due_date: d.due_date,
    status: d.status,
    is_completed: d.is_completed,
    meeting_id: Number.isFinite(meetingId) ? meetingId : undefined,
    created_date: d.created_date,
    mod_date: d.mod_date ?? undefined,
    completed_at: d.completed_at ?? undefined,
    assignees: assigneesArray,
  };
};

/** Build external-directives body from a PreviousDirectiveItem (for close/cancel).
 * external_id is required for close; use id when external_id is missing (legacy).
 */
export const previousDirectiveToExternalDirectiveBody = (d: PreviousDirectiveItem): CreateDirectivePayload => {
  const meetingId = d.meeting_id != null ? Number(d.meeting_id) : undefined;
  const extId = d.external_id ?? d.id;
  return {
    external_id: toExternalId(extId),
    action_number: d.action_number ?? '',
    title: d.title,
    due_date: d.due_date ?? d.mod_date ?? d.created_date ?? '',
    status: d.status,
    is_completed: d.is_completed ?? false,
    meeting_id: Number.isFinite(meetingId) ? meetingId : undefined,
    created_date: d.created_date ?? '',
    mod_date: d.mod_date ?? undefined,
    completed_at: d.completed_at ?? undefined,
    assignees: Array.isArray(d.assignees) ? d.assignees.filter(Boolean) : [],
  };
};

export const createDirective = async (payload: CreateDirectivePayload): Promise<void> => {
  await axiosInstance.post('/api/external-directives', payload);
};

export const closeDirective = async (_directiveId: string, payload: CreateDirectivePayload): Promise<void> => {
  await axiosInstance.post(`/api/external-directives/close`, payload);
};

/** POST /api/minister-directives/{directive_id}/take-directive – Take Directive (الأخذ بالتوجيه) */
export const takeDirective = async (directiveId: string): Promise<void> => {
  await axiosInstance.post(`/api/minister-directives/${directiveId}/take-directive`, {});
};

/** POST /api/minister-directives/{directive_id}/request-meeting – Request Meeting From Directive (طلب إجتماع) */
export const requestMeetingFromDirective = async (directiveId: string): Promise<void> => {
  await axiosInstance.post(`/api/minister-directives/${directiveId}/request-meeting`, {});
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
  /** Filter by consultation type, e.g. 'CONTENT' for استشارة المحتوى tab */
  consultation_type?: string;
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
  if (params.consultation_type) {
    queryParams.append('consultation_type', params.consultation_type);
  }

  const response = await axiosInstance.get<ContentOfficerNotesRecordsResponse>(
    `/api/meeting-requests/${meetingId}/content-officer-notes-record?${queryParams.toString()}`
  );
  return response.data;
};

/** Suggested actions from execution-system for استشارة المحتوى tab – GET /api/v1/business-cards/suggested-actions */
export interface SuggestedActionsParams {
  skip?: number;
  limit?: number;
}

export interface SuggestedActionsResponse {
  items?: unknown[];
  total?: number;
  skip?: number;
  limit?: number;
  [key: string]: unknown;
}

export const getSuggestedActions = async (
  meetingId: string,
  params: SuggestedActionsParams = {}
): Promise<SuggestedActionsResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.set('meeting_id', meetingId);
  if (params.skip !== undefined) queryParams.set('skip', String(params.skip));
  if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
  const response = await axiosInstance.get<SuggestedActionsResponse>(
    `/api/v1/business-cards/suggested-actions?${queryParams.toString()}`
  );
  return response.data;
};

/** Action item from GET /api/v1/adam-meetings/search/{title} response (التوجيهات المرتبطة بالاجتماع) */
export interface AdamMeetingAction {
  title?: string;
  due_date?: string;
  status?: string;
  /** Assignees as string array (e.g. emails: ["f.abuhaimed@momah.gov.sa", "h.alhagbani@momah.gov.sa"]) */
  assignees?: string[];
  invitees?: string[] | Array<{ name?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/** Response from GET /api/v1/adam-meetings/search/{title} – Search Meeting By Title */
export interface AdamMeetingSearchByTitleResponse {
  found: boolean;
  meeting_id?: string;
  meeting_title?: string;
  meeting_start_date?: string;
  meeting_end_date?: string;
  status?: string;
  actions?: AdamMeetingAction[];
  actions_count?: number;
  mom_pdf_base64?: string;
  mom_status?: string;
  message?: string;
}

/**
 * Search for a meeting by title – GET {VITE_BUSINESS_CARDS_BASE_URL}/adam-meetings/search/{title}.
 * Uses .env VITE_BUSINESS_CARDS_BASE_URL (e.g. https://momah-business-cards.momrahai.com/api/v1).
 * Used in توثيق الاجتماع tab for محضر الاجتماع (mom_pdf_base64) and التوجيهات (actions).
 */
export const searchAdamMeetingByTitle = async (
  title: string
): Promise<AdamMeetingSearchByTitleResponse> => {
  const baseUrl = BUSINESS_CARDS_BASE_URL;
  const encodedTitle = encodeURIComponent(title.trim());
  const url = `${baseUrl}/adam-meetings/search/${encodedTitle}`;
  const response = await axiosInstance.get<AdamMeetingSearchByTitleResponse>(url);
  return response.data;
};

/** إغلاق الاجتماع – POST /api/meeting-requests/{meeting_id}/close */
export const closeMeetingRequest = async (meetingId: string): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/close`);
};

// Evaluate Readiness API
export interface EvaluateReadinessResponse {
  readiness_percentage: number;
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
  /** Parsed structure for رؤى الذكاء الاصطناعي */
  ai_insights?: {
    main_topics?: string[];
    business_impact?: string;
    risk_assessment?: string;
    presentation_coherence?: string;
    slide_count_comparison?: {
      original_count?: number;
      new_count?: number;
      difference?: number;
    };
  };
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

/** Delay that rejects if signal is aborted (used by compare polling). */
function delayCompare(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/** Run full compare: POST for status only. If completed → GET and return result. If pending → poll POST, then GET result. Stops when signal is aborted (e.g. modal closed). */
export const runCompareByAttachment = async (
  attachmentId: string,
  options?: { pollIntervalMs?: number; signal?: AbortSignal }
): Promise<ComparePresentationsResponse> => {
  const intervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const signal = options?.signal;

  const pollPost = async (): Promise<void> => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const data = await postCompareByAttachment(attachmentId);
    if (data.status === 'completed') {
      return;
    }
    await delayCompare(intervalMs, signal);
    await pollPost();
  };

  await pollPost();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return getComparisonByAttachment(attachmentId);
};

// LLM notes/insights for a presentation attachment – icon on each attachment (ملاحظات على العرض)
const INSIGHTS_API_BASE = EXECUTION_SYSTEM_BASE_URL;

const INSIGHTS_POLL_INTERVAL_MS = 2000;
const INSIGHTS_MAX_POLL_ATTEMPTS = 60; // 2 minutes at 2s interval

export interface AttachmentInsightsResponse {
  attachment_id: string;
  presentation_id: string;
  extraction_status: string;
  llm_processing_status: string;
  llm_notes?: string[];
  llm_suggestions?: string[];
}

/** GET presentations/by-attachment/{id}/insights from execution-system (single call). */
export const getAttachmentInsights = async (
  attachmentId: string
): Promise<AttachmentInsightsResponse> => {
  const url = `${INSIGHTS_API_BASE}/api/presentations/by-attachment/${attachmentId}/insights`;
  const response = await axiosInstance.get<AttachmentInsightsResponse>(url);
  return response.data;
};

/** Returns true when insights are ready (no need to poll further). Wait for full response so we get both llm_notes and llm_suggestions. */
function isInsightsReady(data: AttachmentInsightsResponse): boolean {
  const extDone = (data.extraction_status || '').toLowerCase() === 'completed';
  const llmDone = (data.llm_processing_status || '').toLowerCase() === 'completed';
  return extDone && llmDone;
}

/** Delay that rejects if signal is aborted (e.g. modal closed). */
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

/** Poll GET insights until extraction_status and llm_processing_status are completed (or we have notes/suggestions). Stops when signal is aborted (e.g. modal closed). */
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
    if (isInsightsReady(lastData)) {
      return lastData;
    }
    await delay(intervalMs, signal);
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    lastData = await getAttachmentInsights(attachmentId);
  }

  // Return last response even if not fully completed (e.g. timeout)
  return lastData;
};
