import axiosInstance from '@/modules/auth/utils/axios';

// ── API Response Types ──

interface OutlookOrganizerResponse {
  name: string;
  email: string;
}

interface OutlookAttendeeResponse {
  name: string;
  email?: string | null;
}

interface OutlookAttachmentResponse {
  name: string;
  content_type: string;
  size: number;
  is_inline: boolean;
  attachment_id: string;
  content_base64?: string;
}

interface OutlookTimelineEventResponse {
  item_id: string;
  subject: string;
  body?: string | null;
  start_datetime: string;
  end_datetime: string;
  location?: string | null;
  change_key: string;
  organizer: OutlookOrganizerResponse;
  attachments?: OutlookAttachmentResponse[] | null;
  is_internal: boolean;
  attendees?: OutlookAttendeeResponse[] | null;
  meeting_id?: string | null;
  meeting_title?: string | null;
  meeting_channel?: string | null;
  meeting_location?: string | null;
  meeting_link?: string | null;
  /** Preferred scheduled fields (when provided by backend). */
  meeting_start_date?: string | null;
  meeting_end_date?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  invitees?: unknown[] | null;
}

interface OutlookTimelineApiResponse {
  success: boolean;
  message: string;
  document_id: string | null;
  data: {
    events: OutlookTimelineEventResponse[];
  };
}

// ── Clean Event Model ──

export interface CalendarTimelineEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  organizer: string;
  organizerEmail: string;
  isInternal: boolean;
  attendees: Array<{ name: string; email: string | null }>;
  meetingId: string | null;
  meetingTitle: string | null;
  meetingChannel: string | null;
  meetingLocation: string | null;
  meetingLink: string | null;
}

// ── Mapper ──

function mapResponseToEvent(raw: OutlookTimelineEventResponse): CalendarTimelineEvent {
  const start = raw.meeting_start_date ?? raw.scheduled_start ?? raw.start_datetime;
  const end = raw.meeting_end_date ?? raw.scheduled_end ?? raw.end_datetime;

  return {
    id: raw.item_id,
    title: raw.subject || 'اجتماع',
    start,
    end,
    location: raw.location ?? null,
    organizer: raw.organizer?.name ?? '',
    organizerEmail: raw.organizer?.email ?? '',
    isInternal: raw.is_internal,
    attendees: (raw.attendees ?? []).map((a) => ({
      name: a.name,
      email: a.email ?? null,
    })),
    meetingId: raw.meeting_id ?? null,
    meetingTitle: raw.meeting_title ?? null,
    meetingChannel: raw.meeting_channel ?? null,
    meetingLocation: raw.meeting_location ?? null,
    meetingLink: raw.meeting_link ?? null,
  };
}

// ── API Service ──

/**
 * Fetch calendar timeline events for a date range.
 * GET /api/v1/outlook/events/timeline?start={start}&end={end}
 */
export async function getMeetingsTimeline(
  start: string,
  end: string,
): Promise<CalendarTimelineEvent[]> {
  const { data } = await axiosInstance.get<OutlookTimelineApiResponse>(
    '/api/v1/outlook/events/timeline',
    { params: { start, end } },
  );
  const events = data?.data?.events;
  return Array.isArray(events) ? events.map(mapResponseToEvent) : [];
}

// ── Range Helpers ──

export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay()); // Sunday
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: d, end };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/** Serialize range using local offset (not UTC) so day/week/month boundaries
 *  align with the wall-clock times displayed in the calendar. */
export function toISORange(range: { start: Date; end: Date }): { startISO: string; endISO: string } {
  return {
    startISO: toLocalISO(range.start),
    endISO: toLocalISO(range.end),
  };
}

function toLocalISO(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const oh = pad(Math.floor(Math.abs(offset) / 60));
  const om = pad(Math.abs(offset) % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${oh}:${om}`;
}
