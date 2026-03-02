import type { QueryClient } from '@tanstack/react-query';
import axiosInstance from '@auth/utils/axios';

/** Monday of the given week at local midnight (must match MinisterCalendarView) */
function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/** Get ISO start/end for the week containing the given date. Used for prefetch and query keys. */
export function getCalendarWeekRange(centerDate: Date): { startISO: string; endISO: string } {
  const start = getWeekStart(centerDate);
  const end = getWeekEnd(start);
  const startISO = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0).toISOString();
  const endISO = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString();
  return { startISO, endISO };
}

/** Same staleTime as calendar useQuery so prefetched data is used when calendar mounts */
export const OUTLOOK_TIMELINE_STALE_MS = 2 * 60 * 1000; // 2 minutes

/** Prefetch a single week for the Outlook timeline (same query key as MinisterCalendarView). */
export async function prefetchOutlookTimelineWeek(
  queryClient: QueryClient,
  startISO: string,
  endISO: string
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: ['outlook-timeline', 'uc02', startISO, endISO],
    queryFn: () => getOutlookTimelineEvents(startISO, endISO),
    staleTime: OUTLOOK_TIMELINE_STALE_MS,
  });
}

/** Prefetch multiple weeks around a center date. Fetches current week first so /calendar can show data ASAP, then prev/next one at a time. */
export async function prefetchOutlookTimelineWeeksAround(
  queryClient: QueryClient,
  centerDate: Date,
  options: { weeksBack?: number; weeksAhead?: number } = {}
): Promise<void> {
  const { weeksBack = 1, weeksAhead = 1 } = options;
  const base = getWeekStart(centerDate);
  // Current week first (offset 0), then previous weeks, then next weeks — so the visible week is ready soonest
  const offsets: number[] = [0];
  for (let i = 1; i <= weeksBack; i++) offsets.push(-i);
  for (let i = 1; i <= weeksAhead; i++) offsets.push(i);
  for (const offset of offsets) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset * 7);
    const { startISO, endISO } = getCalendarWeekRange(d);
    await prefetchOutlookTimelineWeek(queryClient, startISO, endISO);
  }
}

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

/** Minister invitee for create-scheduled-meeting: name, position, mobile, email, meeting_owner */
export interface CreateScheduledMeetingInvitee {
  name: string;
  position: string;
  mobile: string;
  email: string;
  /** true when this invitee is selected as meeting owner */
  meeting_owner?: boolean;
}

/** Payload for POST /api/scheduling/create-scheduled-meeting */
export interface CreateScheduledMeetingPayload {
  meeting_title: string;
  scheduled_start: string; // ISO datetime e.g. "2026-03-06T11:00:00.000Z"
  scheduled_end: string;   // ISO datetime e.g. "2026-03-06T12:00:00.000Z"
  meeting_channel: string; // PHYSICAL | VIRTUAL | HYBRID
  meeting_location?: string; // required when meeting_channel === PHYSICAL
  meeting_link?: string; // Webex join link when meeting_channel is VIRTUAL/HYBRID
  proposer_user_ids?: string[]; // users who receive notification without being invitees
  minister_invitees?: CreateScheduledMeetingInvitee[];
}

/**
 * Create a scheduled meeting from the calendar slot form.
 * POST /api/scheduling/create-scheduled-meeting
 * Payload: { meeting_title, scheduled_start, scheduled_end, invitees }
 */
export const createScheduledMeeting = async (
  payload: CreateScheduledMeetingPayload
): Promise<unknown> => {
  const body: Record<string, unknown> = {
    meeting_title: payload.meeting_title,
    scheduled_start: payload.scheduled_start,
    scheduled_end: payload.scheduled_end,
    meeting_channel: payload.meeting_channel,
    minister_invitees: payload.minister_invitees ?? [],
  };
  if (payload.meeting_location) {
    body.meeting_location = payload.meeting_location;
  }
  if (payload.meeting_link) {
    body.meeting_link = payload.meeting_link;
  }
  if (payload.proposer_user_ids && payload.proposer_user_ids.length > 0) {
    body.proposer_user_ids = payload.proposer_user_ids;
  }
  const { data } = await axiosInstance.post<{ id?: string }>(
    '/api/scheduling/create-scheduled-meeting',
    body
  );
  return data;
};