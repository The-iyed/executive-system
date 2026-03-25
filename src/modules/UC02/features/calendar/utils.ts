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

function formatTimeSlot(date: Date, roundUp = false): string {
  let hour = date.getHours();
  if (roundUp && date.getMinutes() > 0) hour = Math.min(23, hour + 1);
  return `${pad2(hour)}:00`;
}

export function formatExactTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// ── Past event check ──

export function isPastEvent(endDateStr: string): boolean {
  return new Date(endDateStr).getTime() < Date.now();
}

// ── Map CalendarTimelineEvent → CalendarEventData (for grid + detail modal) ──

export function mapTimelineToCalendarEvent(event: CalendarTimelineEvent): CalendarEventData {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const variant = getVariant(event.id);

  if (isNaN(startDate.getTime())) {
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

  const startTime = formatTimeSlot(startDate);
  let endTime = formatTimeSlot(endDate, true);
  if (endTime === startTime && endDate > startDate) {
    const h = parseInt(startTime.split(':')[0], 10);
    endTime = `${pad2(Math.min(23, h + 1))}:00`;
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
    date: startDate,
    exactStartTime: formatExactTime(startDate),
    exactEndTime: formatExactTime(endDate),
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
