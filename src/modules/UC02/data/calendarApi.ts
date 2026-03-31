import axiosInstance from '@/modules/auth/utils/axios';


/** Attachment shape from Outlook timeline API */
export interface OutlookAttachment {
  name: string;
  content_type: string;
  size: number;
  is_inline: boolean;
  attachment_id: string;
  content_base64?: string;
}

/** Outlook timeline event from GET /api/v1/outlook/events/timeline */
export interface OutlookTimelineEvent {
  subject: string;
  body?: string | null;
  start_datetime: string; // ISO datetime
  end_datetime: string;   // ISO datetime
  location?: string | null;
  item_id: string;
  change_key: string;
  organizer: {
    name: string;
    email: string;
  };
  attachments?: OutlookAttachment[] | null;
  /** true = internal, false = external */
  is_internal: boolean;
  /** Optional attendees list from timeline API (قائمة المدعوين) */
  attendees?: Array<{
    name: string;
    email?: string | null;
  }> | null;
  /** When present, this Outlook event is a scheduled meeting from our system; use for edit and PATCH */
  meeting_id?: string | null;
  /** Scheduled meeting fields from API (for edit drawer defaults) */
  meeting_title?: string | null;
  meeting_channel?: string | null;
  meeting_location?: string | null;
  meeting_link?: string | null;
}

export interface OutlookTimelineResponse {
  success: boolean;
  message: string;
  document_id: string | null;
  data: {
    events: OutlookTimelineEvent[];
  };
}

/**
 * Fetch Outlook calendar events for a date range.
 * GET /api/v1/outlook/events/timeline?start={start}&end={end}
 * Returns data.events from the API response.
 */
export const getOutlookTimelineEvents = async (
  start: string,
  end: string
): Promise<OutlookTimelineEvent[]> => {
  const response = await axiosInstance.get<OutlookTimelineResponse>(
    '/api/v1/outlook/events/timeline',
    { params: { start, end } }
  );
  const events = response.data?.data?.events;
  return Array.isArray(events) ? events : [];
};

/** Invitee for create-scheduled-meeting: name, position, mobile, email */
export interface CreateScheduledMeetingInvitee {
  name: string;
  position: string;
  mobile: string;
  email: string;
}

/**
 * Proposer (المقترحون) — full AD profile sent to backend; ids alone are not enough.
 */
export interface CreateScheduledMeetingProposer {
  object_guid: string;
  email: string;
  /** Primary display name */
  name: string;
  name_ar?: string;
  name_en?: string;
  mobile?: string;
  title?: string;
  department?: string;
  company?: string;
  given_name?: string;
  sn?: string;
  cn?: string;
}

/** Payload for POST /api/scheduling/create-scheduled-meeting */
export interface CreateScheduledMeetingPayload {
  meeting_title: string;
  scheduled_start: string; // ISO datetime e.g. "2026-03-06T11:00:00.000Z"
  scheduled_end: string;   // ISO datetime e.g. "2026-03-06T12:00:00.000Z"
  meeting_channel: string; // PHYSICAL | VIRTUAL | HYBRID
  meeting_location?: string; // required when meeting_channel === PHYSICAL
  meeting_link?: string; // Webex join link when meeting_channel is VIRTUAL/HYBRID
  /** From Webex create meeting API; send whenever meeting_link is sent */
  webex_meeting_unique_identifier?: string;
  /** Scheduling settings */
  requires_protocol?: boolean;
  is_data_complete?: boolean;
  /** @deprecated Prefer proposers — kept for backends that only store ids */
  proposer_user_ids?: string[];
  /** Full proposer rows (AD) — preferred */
  proposers?: CreateScheduledMeetingProposer[];
  invitees?: CreateScheduledMeetingInvitee[];
}

/** Payload for PATCH /api/scheduling/scheduled-meeting/{meeting_id} (same shape as create). */
export type UpdateScheduledMeetingPayload = CreateScheduledMeetingPayload;

/** Invitee as returned by create-scheduled-meeting API (may include id, etc.) */
export interface CreateScheduledMeetingResponseInvitee {
  id?: string;
  name?: string | null;
  email?: string | null;
  position?: string | null;
  mobile?: string | null;
  [key: string]: unknown;
}

/** Response from POST /api/scheduling/create-scheduled-meeting (full meeting object). */
export interface CreateScheduledMeetingResponse {
  id: string;
  meeting_title?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  meeting_channel?: string | null;
  meeting_location?: string | null;
  meeting_link?: string | null;
  invitees?: CreateScheduledMeetingResponseInvitee[] | null;
  [key: string]: unknown;
}

/**
 * Map create-scheduled-meeting API response to OutlookTimelineEvent so the calendar
 * cache can replace the optimistic event with one that has the real id and details.
 * Opening the event then triggers getMeetingById(id) and shows full meeting card.
 */
export function mapCreatedMeetingToOutlookEvent(
  created: CreateScheduledMeetingResponse
): OutlookTimelineEvent {
  const start = created.scheduled_start ?? '';
  const end = created.scheduled_end ?? '';
  const attendees = Array.isArray(created.invitees)
    ? created.invitees.map((inv) => ({
        name: inv.name ?? inv.position ?? '—',
        email: inv.email ?? null,
      }))
    : null;
  return {
    subject: created.meeting_title ?? 'اجتماع',
    start_datetime: start,
    end_datetime: end,
    location: created.meeting_location ?? null,
    item_id: created.id,
    change_key: 'created',
    organizer: { name: '', email: '' },
    is_internal: true,
    attendees: attendees ?? undefined,
    meeting_id: created.id,
    meeting_title: created.meeting_title ?? null,
    meeting_channel: created.meeting_channel ?? null,
    meeting_location: created.meeting_location ?? null,
    meeting_link: created.meeting_link ?? null,
  };
}

/**
 * Create a scheduled meeting from the calendar slot form.
 * POST /api/scheduling/create-scheduled-meeting
 * Returns full meeting object so the calendar can replace the optimistic event with real details.
 */
export const createScheduledMeeting = async (
  payload: CreateScheduledMeetingPayload
): Promise<CreateScheduledMeetingResponse> => {
  const body: Record<string, unknown> = {
    meeting_title: payload.meeting_title,
    scheduled_start: payload.scheduled_start,
    scheduled_end: payload.scheduled_end,
    meeting_channel: payload.meeting_channel,
    invitees: payload.invitees ?? [],
  };
  if (payload.meeting_location) {
    body.meeting_location = payload.meeting_location;
  }
  if (payload.meeting_link) {
    body.meeting_link = payload.meeting_link;
  }
  if (payload.webex_meeting_unique_identifier) {
    body.webex_meeting_unique_identifier = payload.webex_meeting_unique_identifier;
  }
  if (payload.requires_protocol !== undefined) {
    body.requires_protocol = payload.requires_protocol;
  }
  if (payload.is_data_complete !== undefined) {
    body.is_data_complete = payload.is_data_complete;
  }
  if (payload.proposers && payload.proposers.length > 0) {
    body.proposers = payload.proposers;
    body.proposer_user_ids = payload.proposers.map((p) => p.object_guid).filter(Boolean);
  } else if (payload.proposer_user_ids && payload.proposer_user_ids.length > 0) {
    body.proposer_user_ids = payload.proposer_user_ids;
  }
  const { data } = await axiosInstance.post<CreateScheduledMeetingResponse>(
    '/api/scheduling/create-scheduled-meeting',
    body
  );
  return data;
};

/**
 * Update an existing scheduled meeting from the calendar.
 * PATCH /api/scheduling/scheduled-meeting/{meeting_id}
 */
export const updateScheduledMeeting = async (
  meetingId: string,
  payload: UpdateScheduledMeetingPayload
): Promise<unknown> => {
  const body: Record<string, unknown> = {
    meeting_title: payload.meeting_title,
    scheduled_start: payload.scheduled_start,
    scheduled_end: payload.scheduled_end,
    meeting_channel: payload.meeting_channel,
    invitees: payload.invitees ?? [],
  };
  if (payload.meeting_location) {
    body.meeting_location = payload.meeting_location;
  }
  if (payload.meeting_link) {
    body.meeting_link = payload.meeting_link;
  }
  if (payload.webex_meeting_unique_identifier) {
    body.webex_meeting_unique_identifier = payload.webex_meeting_unique_identifier;
  }
  if (payload.proposers && payload.proposers.length > 0) {
    body.proposers = payload.proposers;
    body.proposer_user_ids = payload.proposers.map((p) => p.object_guid).filter(Boolean);
  } else if (payload.proposer_user_ids && payload.proposer_user_ids.length > 0) {
    body.proposer_user_ids = payload.proposer_user_ids;
  }
  const { data } = await axiosInstance.patch(
    `/api/scheduling/scheduled-meeting/${meetingId}`,
    body
  );
  return data;
};