import type { CalendarEventData } from '@/modules/shared';
import type { OutlookTimelineEvent } from '@/modules/UC02/data/calendarApi';
import type { CalendarTimelineEvent } from '@/api/meetings/getMeetingsTimeline';

// ── Variant helpers ──

const VARIANTS = ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6'] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getVariant(id: string): string {
  return VARIANTS[hashString(id) % VARIANTS.length];
}

// ── Time formatting ──

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Parse ISO string without timezone conversion – extract raw components */
function parseIsoLocal(iso: string): { date: Date; hour: string; minute: string } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, year, month, day, hour, minute] = m;
  return { date: new Date(Number(year), Number(month) - 1, Number(day)), hour: hour!, minute: minute! };
}

function formatTimeSlot(date: Date, roundUp = false): string {
  let hour = date.getHours();
  if (roundUp && date.getMinutes() > 0) hour = Math.min(23, hour + 1);
  return `${pad2(hour)}:00`;
}

export function formatExactTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Format exact time from an ISO string without timezone conversion */
export function formatExactTimeFromIso(iso: string): string | null {
  const parsed = parseIsoLocal(iso);
  if (!parsed) return null;
  return `${parsed.hour}:${parsed.minute}`;
}

/** Parse ISO to a local Date (day-only, no tz shift) */
export function parseDateFromIso(iso: string): Date | null {
  const parsed = parseIsoLocal(iso);
  return parsed?.date ?? null;
}

// ── Past event check ──

export function isPastEvent(endDateStr: string): boolean {
  return new Date(endDateStr).getTime() < Date.now();
}

// ── Map CalendarTimelineEvent → CalendarEventData (for grid + detail modal) ──

export function mapTimelineToCalendarEvent(event: CalendarTimelineEvent): CalendarEventData {
  const parsedStart = parseIsoLocal(event.start);
  const parsedEnd = parseIsoLocal(event.end);
  const variant = getVariant(event.id);

  if (!parsedStart) {
    return {
      id: event.id,
      type: 'reserved',
      variant,
      label: event.title,
      title: event.title,
      startTime: '08:00',
      endTime: '09:00',
      date: new Date(),
      is_available: false,
      is_internal: event.isInternal,
    };
  }

  const exactStart = `${parsedStart.hour}:${parsedStart.minute}`;
  const exactEnd = parsedEnd ? `${parsedEnd.hour}:${parsedEnd.minute}` : exactStart;

  // Slot-rounded times for grid display
  const startHour = parseInt(parsedStart.hour, 10);
  const startMin = parseInt(parsedStart.minute, 10);
  const startTime = `${pad2(startHour)}:00`;

  let endHour = parsedEnd ? parseInt(parsedEnd.hour, 10) : startHour + 1;
  const endMin = parsedEnd ? parseInt(parsedEnd.minute, 10) : 0;
  if (endMin > 0) endHour = Math.min(23, endHour + 1);
  let endTime = `${pad2(endHour)}:00`;
  if (endTime === startTime) {
    endTime = `${pad2(Math.min(23, startHour + 1))}:00`;
  }

  return {
    id: event.id,
    type: 'reserved',
    variant,
    label: event.title,
    title: event.title,
    is_available: false,
    is_internal: event.isInternal,
    location: event.location,
    organizer: { name: event.organizer, email: event.organizerEmail },
    attendees: event.attendees.map((a) => ({ name: a.name, email: a.email })),
    meeting_id: event.meetingId,
    meeting_title: event.meetingTitle,
    meeting_channel: event.meetingChannel,
    meeting_location: event.meetingLocation,
    meeting_link: event.meetingLink,
    startTime,
    endTime,
    date: parsedStart.date,
    exactStartTime: exactStart,
    exactEndTime: exactEnd,
  };
}

// ── Map CalendarTimelineEvent → OutlookTimelineEvent (MinisterFullCalendar compatibility) ──

export function mapTimelineToOutlookEvent(event: CalendarTimelineEvent): OutlookTimelineEvent {
  return {
    item_id: event.id,
    subject: event.title,
    start_datetime: event.start,
    end_datetime: event.end,
    location: event.location,
    organizer: { name: event.organizer, email: event.organizerEmail },
    is_internal: event.isInternal,
    change_key: '',
    attendees: event.attendees.map((a) => ({ name: a.name, email: a.email })),
    meeting_id: event.meetingId,
    meeting_title: event.meetingTitle,
    meeting_channel: event.meetingChannel,
    meeting_location: event.meetingLocation,
    meeting_link: event.meetingLink,
  };
}
