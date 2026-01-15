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
  general_notes: string | null;
  content_officer_notes: string | null;
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

  const response = await axiosInstance.get<MeetingsListResponse>(`/api/meetings?${queryParams.toString()}`);
  return response.data;
};

// Fetch assigned scheduling requests (for "الاجتماعات المجدولة" view)
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

export const getMeetingById = async (meetingId: string): Promise<MeetingApiResponse> => {
  const response = await axiosInstance.get<MeetingApiResponse>(`/api/meetings/${meetingId}`);
  return response.data;
};

export interface RejectMeetingRequest {
  reason: string;
  notes: string;
}

export const rejectMeeting = async (meetingId: string, payload: RejectMeetingRequest): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/reject`, payload);
};

export interface SendToContentRequest {
  notes: string;
}

export const sendToContent = async (meetingId: string, payload: SendToContentRequest): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/send-to-content`, payload);
};

export interface RequestGuidanceRequest {
  notes: string;
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
  invitees?: Array<{ user_id?: string | null; external_email?: string | null; is_required?: boolean }>;
  minister_attendees?: Array<any>;
  related_directive_ids?: string[];
  general_notes?: string | null;
  content_officer_notes?: string | null;
}

export const updateMeetingRequest = async (
  meetingId: string,
  payload: UpdateMeetingRequestPayload
): Promise<void> => {
  await axiosInstance.put(`/api/meeting-requests/${meetingId}/update`, payload);
};

export interface ReturnForInfoRequest {
  notes: string;
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
}

export interface ScheduleMeetingRequest {
  scheduled_at: string;
  meeting_channel: string;
  requires_protocol: boolean;
  protocol_type: string | null;
  is_data_complete: boolean;
  notes: string;
  location?: string;
  minister_attendees: MinisterAttendee[];
}

export const scheduleMeeting = async (
  meetingId: string,
  payload: ScheduleMeetingRequest
): Promise<void> => {
  await axiosInstance.post(`/api/meeting-requests/${meetingId}/schedule`, payload);
};

