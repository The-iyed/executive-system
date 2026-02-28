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