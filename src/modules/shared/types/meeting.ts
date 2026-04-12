/**
 * Shared domain types for meetings (API responses, request payloads, entities).
 * Re-exports meeting-types (enums/labels) and adds API/domain types.
 */

export * from './meeting-types';

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

export interface MinisterAttendee {
  id?: string;
  username?: string;
  external_email?: string;
  external_name?: string;
  is_required: boolean;
  justification: string;
  access_permission: string;
  position?: string;
  phone?: string;
  mobile?: string;
  attendance_channel?: 'PHYSICAL' | 'REMOTE';
  attendance_mechanism?: string;
  response_status?: string;
  sector?: string | null;
  is_consultant?: boolean;
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
  scheduled_start?: string | null;
  scheduled_end?: string | null;
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
  /** Join link when VIRTUAL/HYBRID (calendar create + schedule API). */
  meeting_url?: string | null;
  meeting_link?: string | null;
  is_sequential: boolean;
  sequential_number: number | null;
  previous_meeting_id: string | null;
  previous_meeting?: {
    item_number?: number;
    meeting_id: string;
    meeting_title?: string | null;
    meeting_date?: string | null;
    meeting?: unknown | null;
  } | null;
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
  related_directives?: RelatedDirective[];
  related_guidance: string | null;
  general_notes: GeneralNoteItem[] | string | null;
  content_officer_notes: string | null;
  executive_summary?: string | null;
  meeting_justification: string;
  related_topic: string | null;
  deadline: string | null;
  meeting_classification_type: string;
  meeting_confidentiality: string;
  sector: string;
  description?: string | null;
  note?: string | null;
  location?: string | null;
  meeting_description?: string | null;
  meeting_start_date?: string | null;
  meeting_end_date?: string | null;
  meeting_location?: string | null;
  meeting_owner?: {
    id: string;
    name: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    position?: string | null;
    phone_number?: string | null;
    sub?: string | null;
    ar_name?: string | null;
    national_id?: string | null;
  } | string | null;
  is_on_behalf_of?: boolean | null;
  is_based_on_directive?: boolean | null;
  directive_method?: string | null;
  previous_meeting_minutes_id?: string | null;
  when_presentation_attached?: string | null;
  scheduled_end_at?: string | null;
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

import type { MeetingStatus } from './meeting-types';

export interface GetMeetingsParams {
  status?: MeetingStatus | string;
  skip?: number;
  limit?: number;
  search?: string;
  owner_type?: string;
  start_date?: string;
  end_date?: string;
  date_now?: string;
}

export interface MeetingSearchResult {
  id: number;
  uep_id: string;
  adam_id: string;
  original_title: string;
  meeting_title: string;
  group_id: number;
}

export interface SearchMeetingsParams {
  q: string;
  limit?: number;
}

export interface RejectMeetingRequest {
  reason: string;
  notes: string;
}

export interface SendToContentRequest {
  notes: string;
  is_draft?: boolean;
}

export interface RequestGuidanceRequest {
  notes: string;
  is_draft?: boolean;
}

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

export interface RequestSchedulingConsultationRequest {
  consultant_user_ids: string[];
  consultation_question: string;
  is_draft?: boolean;
}

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
  minister_attendees?: MinisterAttendee[];
  related_directive_ids?: string[];
  general_notes?: string | null;
  content_officer_notes?: string | null;
  meeting_owner?: string;
  is_sequential?: boolean;
  previous_meeting_id?: string | null;
  is_based_on_directive?: boolean;
  directive_method?: string | null;
  previous_meeting_minutes_id?: string | null;
  related_guidance?: string | null;
}

export interface ReturnForInfoRequest {
  notes: string;
  editable_fields?: string[];
}

export interface ScheduleMeetingRequest {
  scheduled_start: string;
  scheduled_end: string;
  meeting_channel: string;
  requires_protocol: boolean;
  protocol_type: string | null;
  is_data_complete: boolean;
  notes: string;
  location?: string;
  meeting_url?: string;
  minister_attendees: MinisterAttendee[];
}

export interface CreateWebexMeetingRequest {
  meeting_title: string;
  start_datetime: string;
  time_zone: string;
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

export interface EvaluateReadinessResponse {
  readiness_percentage: number;
  readiness: string;
  reasoning: string[];
}
