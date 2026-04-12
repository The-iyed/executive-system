import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User, Calendar, Clock, MapPin, X, Pencil } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader } from '@/modules/shared';
import {
  WeeklyCalendarNavigation,
  type CalendarEventData,
  type CalendarViewMode,
} from '@/modules/shared';
import { MinisterFullCalendar } from './MinisterFullCalendar';
import { Skeleton, cn, Dialog, DialogContent, DialogHeader, DialogTitle, toISOStringWithTimezone } from '@/lib/ui';
import {
  getOutlookTimelineEvents,
  createScheduledMeeting,
  updateScheduledMeeting,
  mapCreatedMeetingToOutlookEvent,
  type OutlookTimelineEvent,
} from '../data/calendarApi';

/** Build an optimistic Outlook event for the calendar cache (no GET refetch). */
function buildOptimisticOutlookEvent(
  meetingTitle: string,
  scheduledStart: string,
  scheduledEnd: string,
  optimisticId: string
): OutlookTimelineEvent {
  return {
    subject: meetingTitle || 'اجتماع',
    start_datetime: scheduledStart,
    end_datetime: scheduledEnd,
    item_id: optimisticId,
    change_key: 'optimistic',
    organizer: { name: '', email: '' },
    is_internal: true,
  };
}
import { getMeetingById, type MeetingApiResponse } from '../data/meetingsApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import type { CreateScheduledMeetingResponse } from '../data/calendarApi';
import { CalendarSlotMeetingForm } from './CalendarSlotMeetingForm';

/** Normalize create-scheduled-meeting response so it can be used for MeetingCard (same modal as work basket). */
function normalizedMeetingFromCreateResponse(
  created: CreateScheduledMeetingResponse
): MeetingApiResponse {
  const r = created as Record<string, unknown>;
  return {
    ...created,
    request_number: (r.request_number as string) ?? '',
    status: (r.status as string) ?? 'SCHEDULED',
    meeting_subject: created.meeting_title ?? '',
    submitted_at: (r.submitted_at as string) ?? (r.created_at as string) ?? '',
    created_at: (r.created_at as string) ?? new Date().toISOString(),
    submitter_name: (r.submitter_name as string) ?? '',
    meeting_start_date: created.scheduled_start ?? null,
    meeting_classification: (r.meeting_classification as string) ?? 'BUSINESS',
    is_data_complete: (r.is_data_complete as boolean) ?? true,
  } as unknown as MeetingApiResponse;
}

import { trackEvent } from '@/lib/analytics';

const fontStyle = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" } as const;

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function formatDetailDate(date: Date): string {
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  return `${dayName} ${day} ${month}`;
}

/** Sunday of the given week at local midnight */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const day = d.getDay();
  // Make Sunday (0) the first day of the week
  d.setDate(d.getDate() - day);
  return d;
};

const getWeekEnd = (weekStart: Date): Date => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

/** First moment of calendar month */
const getMonthStart = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);

/** Last moment of calendar month */
const getMonthEnd = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const getRandomVariant = (id: string): string => {
  const variants = ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % variants.length;
  return variants[index];
};

/** Parse ISO string without timezone conversion */
function parseIsoLocal(iso: string): { date: Date; hour: number; minute: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), hour: Number(m[4]), minute: Number(m[5]) };
}

/** Local wall time → hour slot (HH:00). */
const formatTimeToSlot = (hour: number, minute: number, roundUp: boolean = false): string => {
  let slotHour = roundUp && minute > 0 ? hour + 1 : hour;
  slotHour = Math.max(0, Math.min(23, slotHour));
  return `${slotHour.toString().padStart(2, '0')}:00`;
};

const formatExactTimeRaw = (hour: number, minute: number): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

/** Extract exact time from ISO string without timezone conversion */
const formatExactTimeFromIso = (iso: string): string | null => {
  const parsed = parseIsoLocal(iso);
  if (!parsed) return null;
  return formatExactTimeRaw(parsed.hour, parsed.minute);
};

/** Map API attachment to calendar event attachment (no base64) */
function mapAttachments(attachments: OutlookTimelineEvent['attachments']): CalendarEventData['attachments'] {
  if (!Array.isArray(attachments)) return undefined;
  return attachments.map((a) => ({
    name: a.name,
    content_type: a.content_type,
    size: a.size,
    is_inline: a.is_inline,
    attachment_id: a.attachment_id,
  }));
}

const mapOutlookEventToCalendarEvent = (event: OutlookTimelineEvent): CalendarEventData => {
  const parsedStart = parseIsoLocal(event.start_datetime);
  const parsedEnd = parseIsoLocal(event.end_datetime);
  const id = event.item_id;
  const title = event.subject || 'اجتماع';
  const variantByInternal = getRandomVariant(id);
  const baseFields = {
    id,
    type: 'reserved' as const,
    variant: variantByInternal,
    label: title,
    title,
    is_available: false,
    is_internal: event.is_internal,
    location: event.location ?? undefined,
    organizer: event.organizer,
    attachments: mapAttachments(event.attachments),
    attendees: event.attendees ?? null,
    meeting_id: event.meeting_id ?? undefined,
    meeting_title: event.meeting_title ?? undefined,
    meeting_channel: event.meeting_channel ?? undefined,
    meeting_location: event.meeting_location ?? undefined,
    meeting_link: event.meeting_link ?? undefined,
  };
  if (!parsedStart) {
    return {
      ...baseFields,
      startTime: '08:00',
      endTime: '09:00',
      date: new Date(),
    };
  }
  const startTime = formatTimeToSlot(parsedStart.hour, parsedStart.minute, false);
  const endHour = parsedEnd?.hour ?? parsedStart.hour + 1;
  const endMinute = parsedEnd?.minute ?? 0;
  let endTime = formatTimeToSlot(endHour, endMinute, true);
  if (endTime === startTime) {
    endTime = `${Math.min(23, parsedStart.hour + 1).toString().padStart(2, '0')}:00`;
  }
  return {
    ...baseFields,
    startTime,
    endTime,
    date: parsedStart.date,
    exactStartTime: formatExactTimeRaw(parsedStart.hour, parsedStart.minute),
    exactEndTime: parsedEnd ? formatExactTimeRaw(parsedEnd.hour, parsedEnd.minute) : formatExactTimeRaw(parsedStart.hour + 1, 0),
  };
};

export interface MinisterCalendarViewProps {
  extraEvents?: CalendarEventData[];
  initialDate?: Date;
}

export const MinisterCalendarView: React.FC<MinisterCalendarViewProps> = ({ 
  extraEvents = [],
  initialDate
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [previousEvents, setPreviousEvents] = useState<CalendarEventData[]>([]);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<CalendarEventData | null>(null);
  const [slotForNewMeeting, setSlotForNewMeeting] = useState<{
    date: Date;
    time: string;
    /** End time from calendar selection (HH:mm). If missing, form uses start + 1h. */
    endTime?: string;
    title?: string;
    meetingLocation?: string | null;
    meetingChannel?: string;
    meetingId?: string;
    mode?: 'create' | 'edit';
    /** Pre-fill invitees table when editing (from event.attendees) */
    initialInvitees?: Array<Record<string, unknown>>;
  } | null>(null);
  const [slotFormSubmitting, setSlotFormSubmitting] = useState(false);
  const [slotFormError, setSlotFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('weekly');


  const isOptimisticEvent = !!selectedEventForDetails?.id?.startsWith('optimistic-');
  const isOutlookId = !!selectedEventForDetails?.id?.startsWith('AAMk');
  /** Use meeting_id when present (our system); else use id if it's our uuid (not optimistic, not Outlook AAMk). */
  const meetingIdToFetch =
    selectedEventForDetails?.meeting_id ??
    (selectedEventForDetails?.id && !isOptimisticEvent && !isOutlookId ? selectedEventForDetails.id : undefined);
  const isOurMeeting = !!meetingIdToFetch;
  const { data: meetingDetail, isLoading: isLoadingMeeting, isError: isMeetingError } = useQuery({
    queryKey: ['meeting', meetingIdToFetch],
    queryFn: () => getMeetingById(meetingIdToFetch!),
    enabled: !!meetingIdToFetch,
  });
  const meetingCardData = useMemo(
    () => (meetingDetail ? mapMeetingToCardData(meetingDetail) : null),
    [meetingDetail]
  );
  /** Unified display for modal: same sectioned layout (virtual style) for all events; data from API when available, else from calendar event. */
  const eventDisplay = useMemo(() => {
    if (!selectedEventForDetails) return null;
    const ev = selectedEventForDetails;
    const meeting = meetingDetail as (MeetingApiResponse & { meeting_link?: string | null; meeting_url?: string; meeting_location?: string | null }) | undefined;
    const fromApi = meeting && !isLoadingMeeting;
    const scheduledStartDate = fromApi && meeting.scheduled_start
      ? (parseIsoLocal(meeting.scheduled_start)?.date ?? ev.date)
      : ev.date;
    const startTime =
      fromApi && meeting.scheduled_start
        ? (formatExactTimeFromIso(meeting.scheduled_start) ?? (ev.exactStartTime || ev.startTime))
        : (ev.exactStartTime || ev.startTime);
    const endTime =
      fromApi && meeting.scheduled_end
        ? (formatExactTimeFromIso(meeting.scheduled_end) ?? (ev.exactEndTime || ev.endTime))
        : (ev.exactEndTime || ev.endTime);
    const locationText =
      (fromApi && (meeting.meeting_link ?? meeting.meeting_url ?? meeting.meeting_location)) ||
      ev.meeting_link ||
      ev.meeting_location ||
      ev.location ||
      '';
    const inviteesList =
      fromApi && Array.isArray(meeting.invitees) && meeting.invitees.length > 0
        ? meeting.invitees.map((inv) => {
            const row = inv as Record<string, unknown>;
            return {
              name: String(row.external_name ?? row.name ?? row.position ?? '—'),
              email: row.external_email != null || row.email != null ? String(row.external_email ?? row.email) : undefined,
            };
          })
        : (ev.attendees ?? []);
    return {
      title: (fromApi ? meeting.meeting_title : ev.title) || ev.meeting_title || 'اجتماع',
      is_internal: ev.is_internal,
      organizerName: fromApi ? meeting.submitter_name : ev.organizer?.name ?? '',
      organizerEmail: fromApi ? (meeting.current_owner_user?.email ?? '') : (ev.organizer?.email ?? ''),
      date: scheduledStartDate,
      startTime,
      endTime,
      locationOrLink: locationText,
      invitees: inviteesList,
      meeting_id: ev.meeting_id,
      meeting_channel: ev.meeting_channel ?? meeting?.meeting_channel,
      meeting_title: ev.meeting_title ?? ev.title,
      exactStartTime: ev.exactStartTime || startTime,
      exactEndTime: ev.exactEndTime || endTime,
      attendees: ev.attendees,
    };
  }, [selectedEventForDetails, meetingDetail, isLoadingMeeting]);

  // Sync currentDate if initialDate changes (e.g. when opening modal with a new selection)
  React.useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  /**
   * API range must cover whatever FullCalendar shows, and stay stable when switching
   * daily ↔ weekly (same week → same query key → no empty flash).
   */
  const apiRangeStart = useMemo(() => {
    if (viewMode === 'monthly') return getMonthStart(currentDate);
    return getWeekStart(currentDate);
  }, [currentDate, viewMode]);

  const apiRangeEnd = useMemo(() => {
    if (viewMode === 'monthly') return getMonthEnd(currentDate);
    return getWeekEnd(apiRangeStart);
  }, [currentDate, viewMode, apiRangeStart]);

  const startDateISO = useMemo(() => {
    const date = new Date(apiRangeStart);
    date.setHours(0, 0, 0, 0);
    return toISOStringWithTimezone(date);
  }, [apiRangeStart]);

  const endDateISO = useMemo(() => {
    const date = new Date(apiRangeEnd);
    date.setHours(23, 59, 59, 999);
    return toISOStringWithTimezone(date);
  }, [apiRangeEnd]);

  const { data: timelineEvents, isLoading, isFetching, error } = useQuery({
    queryKey: ['outlook-timeline', 'uc02', startDateISO, endDateISO],
    queryFn: () => getOutlookTimelineEvents(startDateISO, endDateISO),
    enabled: true,
    staleTime: 2 * 60 * 1000,
    /** Avoid empty calendar while range key changes (e.g. month ↔ week). */
    placeholderData: (prev) => prev,
  });

  // Process Outlook timeline events and merge with extraEvents
  const processedEvents = useMemo(() => {
    const mapped = (timelineEvents ?? []).map(mapOutlookEventToCalendarEvent);
    return [...mapped, ...extraEvents];
  }, [timelineEvents, extraEvents]);

  // Update previous events when we get new data
  // Use a ref to track the last event IDs to prevent infinite loops
  const lastEventIdsRef = React.useRef<string>('');
  
  React.useEffect(() => {
    if (processedEvents.length > 0 && !isFetching) {
      // Create a stable string representation of event IDs to compare
      const currentEventIds = processedEvents.map(e => e.id).sort().join(',');
      
      // Only update if the event IDs have actually changed
      if (currentEventIds !== lastEventIdsRef.current) {
        lastEventIdsRef.current = currentEventIds;
        setPreviousEvents(processedEvents);
      }
    }
  }, [processedEvents, isFetching]);

  // Use new events if available, otherwise use previous events
  const events: CalendarEventData[] = processedEvents.length > 0 
    ? processedEvents 
    : previousEvents;

  const handlePreviousWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewMode === 'monthly') {
        newDate.setMonth(prev.getMonth() - 1);
      } else if (viewMode === 'daily') {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() - 7);
      }
      return newDate;
    });
  }, [viewMode]);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewMode === 'monthly') {
        newDate.setMonth(prev.getMonth() + 1);
      } else if (viewMode === 'daily') {
        newDate.setDate(prev.getDate() + 1);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  }, [viewMode]);

  // Track if we've ever loaded data successfully
  const hasLoadedOnce = React.useRef(false);
  React.useEffect(() => {
    if (timelineEvents && !isFetching) {
      hasLoadedOnce.current = true;
    }
  }, [timelineEvents, isFetching]);

  // Show inline loader only on the very first load (keeps layout visible, no full-page overlay)
  const isInitialLoad = isLoading && !hasLoadedOnce.current && previousEvents.length === 0 && !error;

  if (isInitialLoad) {
    return (
      <div className="w-full flex-1 min-h-[400px] flex items-center justify-center" dir="rtl">
        <Loader />
      </div>
    );
  }

  // Show error only on initial load with no previous data
  if (error && !timelineEvents && previousEvents.length === 0 && !hasLoadedOnce.current) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center text-red-600" dir="rtl">
        حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  // Calendar skeleton component for loading state
  const CalendarSkeleton = () => {
    const skeletonWeekStart = getWeekStart(currentDate);
    const weekDates = useMemo(() => {
      const dates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(skeletonWeekStart);
        date.setDate(skeletonWeekStart.getDate() + i);
        dates.push(date);
      }
      return dates;
    }, [skeletonWeekStart.getTime()]);

    const timeSlots = useMemo(() => {
      const slots = [];
      for (let i = 0; i <= 23; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
      }
      return slots;
    }, []);

    // Generate some random skeleton event positions
    const skeletonEvents = useMemo(() => {
      const events: Array<{ dayIndex: number; timeIndex: number; height: number }> = [];
      // Add 3-5 skeleton events randomly
      const numEvents = 4;
      for (let i = 0; i < numEvents; i++) {
        events.push({
          dayIndex: Math.floor(Math.random() * 7),
          timeIndex: Math.floor(Math.random() * (timeSlots.length - 2)),
          height: Math.random() > 0.5 ? 2 : 1, // 1 or 2 hour blocks
        });
      }
      return events;
    }, [timeSlots.length]);

    return (
      <div className="w-full overflow-hidden bg-white" style={{ borderBottomLeftRadius: '14.5312px', borderBottomRightRadius: '14.5312px' }}>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_52px]">
          {weekDates.map((_date, index) => (
            <div
              key={index}
              className="p-2 min-h-[67px] border-b border-r flex flex-col justify-center"
              style={{ borderColor: '#EBEBEB', borderStyle: 'dashed', borderWidth: '0.908201px', background: 'rgba(255,255,255,0.6)' }}
            >
              <Skeleton className="h-4 w-6 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
          <div className="min-h-[67px] border-b border-r" style={{ borderColor: '#EBEBEB', borderStyle: 'dashed', borderWidth: '0.908201px', background: 'rgba(255,255,255,0.6)' }} />
        </div>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_52px]">
          {timeSlots.map((time, timeIndex) => (
            <React.Fragment key={time}>
              {weekDates.map((_date, dayIndex) => {
                const hasSkeletonEvent = skeletonEvents.some(
                  (e) => e.dayIndex === dayIndex && e.timeIndex === timeIndex
                );
                const skeletonEvent = skeletonEvents.find(
                  (e) => e.dayIndex === dayIndex && e.timeIndex === timeIndex
                );
                return (
                  <div
                    key={dayIndex}
                    className="min-h-[53px] border-b border-r relative"
                    style={{ borderColor: '#EAECED', borderStyle: 'dashed', borderWidth: '0.908201px' }}
                  >
                    {hasSkeletonEvent && skeletonEvent && (
                      <div
                        className="absolute inset-1 rounded-[7.58px] bg-[#F1F5F9] border border-[#D2E0EE]"
                        style={{ height: `${skeletonEvent.height * 53 - 8}px` }}
                      >
                        <Skeleton className="h-full w-full rounded-[7.58px]" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="min-h-[53px] border-b border-r" style={{ borderColor: '#EAECED', borderStyle: 'dashed', borderWidth: '0.908201px' }} />
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Always show the calendar structure - never remove it after initial load
  return (
    <div className="w-full flex flex-col relative overflow-hidden flex-1 min-h-0 gap-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-row justify-between items-center flex-none px-5 py-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
            <ChevronDown className="w-4 h-4 text-[#048F86]" />
          </div>
          <div className="flex flex-col items-end">
            <h1 className="font-bold text-gray-800 text-[16px]" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
              التقويم
            </h1>
            <p className="text-gray-400 text-[11px]" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
              عرض الجدول الزمني للاجتماعات
            </p>
          </div>
        </div>
        <WeeklyCalendarNavigation
          currentDate={currentDate}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      <div className="relative flex-1 min-h-0 bg-white overflow-auto rounded-2xl shadow-sm border border-gray-100">
        {isInitialLoad ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="relative min-h-[580px] h-[min(78vh,820px)] w-full p-3 bg-white">
              <MinisterFullCalendar
                viewMode={viewMode === 'monthly' ? 'monthly' : viewMode === 'daily' ? 'daily' : 'weekly'}
                currentDate={currentDate}
                onCurrentDateChange={undefined}
                outlookEvents={timelineEvents ?? []}
                extraEvents={extraEvents}
                onEventClick={setSelectedEventForDetails}
                onTimeSlotSelect={(date, time, endTime) =>
                  setSlotForNewMeeting({ date, time, endTime, mode: 'create' })
                }
              />
            </div>
            {/* Syncing: thin teal bar + dots — no blocking copy */}
            {isFetching && (
              <div
                className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-col items-center gap-2"
                aria-busy
                aria-label="مزامنة التقويم"
              >
                <div className="h-[3px] w-full max-w-md overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="minister-cal-shimmer-bar h-full w-1/3 rounded-full bg-[#048F86]"
                  />
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-sm border border-gray-100">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="minister-cal-dot h-2 w-2 rounded-full bg-[#048F86]"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error message overlay if there's an error but we have previous data */}
      {error && (timelineEvents || previousEvents.length > 0) && (
        <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-20">
          <p className="text-sm text-red-600 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
            حدث خطأ أثناء تحديث المواعيد. يرجى المحاولة مرة أخرى.
          </p>
        </div>
      )}

      {/* Event details modal – unified sectioned layout (same as virtual) for all events */}
      <Dialog open={!!selectedEventForDetails} onOpenChange={(open) => !open && setSelectedEventForDetails(null)}>
        <DialogContent className="max-w-[860px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-gray-200 shadow-xl [&>button]:hidden" dir="rtl">
          {selectedEventForDetails && (
            <>
              {isLoadingMeeting && (
                <div className="flex items-center justify-center py-16">
                  <Loader />
                </div>
              )}
              {!isLoadingMeeting && eventDisplay && (
                <div className="flex flex-col" style={fontStyle}>
                  {/* Header */}
                  <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <h3 className="text-gray-900 font-bold text-[16px] leading-6">
                        {eventDisplay.title}
                      </h3>
                      {eventDisplay.is_internal !== undefined && (
                        <span className={cn(
                          'text-[11px] font-semibold px-2 py-0.5 rounded w-fit',
                          eventDisplay.is_internal
                            ? 'bg-[#048F86]/10 text-[#048F86]'
                            : 'bg-gray-100 text-gray-500'
                        )}>
                          {eventDisplay.is_internal ? 'داخلي' : 'خارجي'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedEventForDetails(null)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 mr-3"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {/* Body – exact same sectioned layout for all event types */}
                    <div className="flex flex-col px-6 py-2">
                      {/* Organizer – always show */}
                      <div className="flex items-center gap-3 py-3.5 border-b border-gray-50">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="text-[13px] font-semibold text-gray-800 truncate w-full">
                            {eventDisplay.organizerName || '—'}
                          </span>
                          {eventDisplay.organizerEmail ? (
                            <span className="text-[11px] text-gray-400 truncate w-full">{eventDisplay.organizerEmail}</span>
                          ) : (
                            <span className="text-[11px] text-gray-400 truncate w-full">—</span>
                          )}
                        </div>
                      </div>

                      {/* Date – always show */}
                      <div className="flex items-center gap-3 py-3.5 border-b border-gray-50">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">
                          {formatDetailDate(eventDisplay.date)}
                        </span>
                      </div>

                      {/* Time – always show */}
                      <div className="flex items-center gap-3 py-3.5 border-b border-gray-50">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">
                          {eventDisplay.startTime} – {eventDisplay.endTime}
                        </span>
                      </div>

                      {/* Location / meeting link – always show; link when URL, text otherwise */}
                      <div className="flex items-center gap-3 py-3.5 border-b border-gray-50">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {eventDisplay.locationOrLink ? (
                            eventDisplay.locationOrLink.startsWith('http') ? (
                              <a
                                href={eventDisplay.locationOrLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] font-medium text-[#048F86] underline underline-offset-2 truncate block"
                              >
                                {eventDisplay.locationOrLink}
                              </a>
                            ) : (
                              <span className="text-[13px] font-medium text-gray-700 truncate block">
                                {eventDisplay.locationOrLink}
                              </span>
                            )
                          ) : (
                            <span className="text-[13px] font-medium text-gray-500 truncate block">—</span>
                          )}
                        </div>
                      </div>

                      {/* Invitees – قائمة المدعوين – always show same block */}
                      <div className="flex flex-col gap-2 py-3.5 border-b border-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                            </div>
                            <span className="text-[13px] font-semibold text-gray-800">
                              قائمة المدعوين
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 bg-gray-50 rounded-full px-2 py-0.5">
                            {eventDisplay.invitees.length} مدعو
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-1">
                          {eventDisplay.invitees.length > 0 ? (
                            eventDisplay.invitees.map((attendee, idx) => (
                              <div
                                key={`${attendee.name}-${attendee.email ?? ''}-${idx}`}
                                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50"
                              >
                                <span className="text-[13px] font-medium text-gray-800 truncate">
                                  {attendee.name || '—'}
                                </span>
                                {attendee.email ? (
                                  <span className="text-[11px] text-gray-500 truncate max-w-[180px]">
                                    {attendee.email}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-400">—</span>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-[12px] text-gray-500 py-1">لا يوجد مدعوون</span>
                          )}
                        </div>
                      </div>

                      {isOurMeeting && (isMeetingError || !meetingCardData) && (
                        <p className="text-[11px] text-amber-600 py-2">تعذر تحميل بعض بيانات الاجتماع. يمكنك عرض التفاصيل الكاملة من الزر أدناه.</p>
                      )}
                    </div>

                  {/* Actions – عرض التفاصيل + تعديل always enabled; use meeting_id when present, else event id */}
                  <div className="flex w-full justify-end gap-2 flex-wrap px-6 pb-5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const id = eventDisplay.meeting_id ?? selectedEventForDetails.id;
                        setSelectedEventForDetails(null);
                        navigate(`/meeting/${id}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-3.5 rounded-lg text-white text-xs font-semibold transition-colors"
                      style={{ background: 'var(--color-primary-500)' }}
                    >
                      عرض التفاصيل
                    </button>
                    {eventDisplay.meeting_id && (
                      <button
                        type="button"
                        onClick={() => {
                          const meetingId = eventDisplay.meeting_id!;
                          setSelectedEventForDetails(null);
                          navigate(`/calendar?form=edit&id=${meetingId}`);
                        }}
                        className="inline-flex max-w-[130px] items-center gap-1.5 px-3 py-3.5 rounded-lg border border-[#048F86]/30 text-xs font-semibold text-[#048F86] bg-[#F0FDFA] hover:bg-[#E0F7F4] hover:border-[#048F86]/50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        تعديل
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create meeting from slot drawer */}
      {slotForNewMeeting && (
        <CalendarSlotMeetingForm
          key={
            slotForNewMeeting.meetingId ??
            `create-${slotForNewMeeting.date.getTime()}-${slotForNewMeeting.time}-${slotForNewMeeting.endTime ?? ''}`
          }
          open={!!slotForNewMeeting}
          onOpenChange={(open) => !open && setSlotForNewMeeting(null)}
          slotDate={slotForNewMeeting.date}
          slotTime={slotForNewMeeting.time}
          slotEndTime={slotForNewMeeting.endTime}
          initialTitle={slotForNewMeeting.title ?? ''}
          initialMeetingLocation={slotForNewMeeting.meetingLocation ?? undefined}
          initialMeetingChannel={slotForNewMeeting.meetingChannel ?? ''}
          initialInvitees={slotForNewMeeting.initialInvitees}
          isSubmitting={slotFormSubmitting}
          submitError={slotFormError}
          onSubmit={async (values) => {
            setSlotFormError(null);
            setSlotFormSubmitting(true);
            const scheduled_start = toISOStringWithTimezone(new Date(values.start_date));
            const scheduled_end = toISOStringWithTimezone(new Date(values.end_date));
            const isEdit = slotForNewMeeting?.mode === 'edit' && slotForNewMeeting.meetingId;

            try {
              const invitees = values.invitees.map((m: Record<string, unknown>) => ({
                name: (m.name ?? m.full_name ?? m.position ?? '') as string,
                position: (m.position ?? m.position_title ?? '') as string,
                mobile: (m.mobile ?? m.mobile_number ?? '') as string,
                email: (m.email ?? '') as string,
                is_presence_required: Boolean(m?.is_presence_required),
              }));

              if (isEdit) {
                await updateScheduledMeeting(slotForNewMeeting!.meetingId!, {
                  meeting_title: values.title,
                  scheduled_start,
                  scheduled_end,
                  meeting_channel: values.meeting_channel,
                  meeting_location: values.meeting_location,
                  proposers: values.proposers,
                  invitees,
                });
                trackEvent('UC-02', 'uc02_meeting_updated_from_calendar', {
                  meeting_id: slotForNewMeeting!.meetingId,
                  meeting_title: values.title,
                });
              } else {
                const optimisticId = `optimistic-${Date.now()}`;
                const optimisticEvent = buildOptimisticOutlookEvent(
                  values.title,
                  scheduled_start,
                  scheduled_end,
                  optimisticId
                );

                queryClient.setQueryData<OutlookTimelineEvent[]>(
                  ['outlook-timeline', 'uc02', startDateISO, endDateISO],
                  (old) => [...(old ?? []), optimisticEvent]
                );

                const result = await createScheduledMeeting({
                  meeting_title: values.title,
                  scheduled_start,
                  scheduled_end,
                  meeting_channel: values.meeting_channel,
                  meeting_location: values.meeting_location,
                  proposers: values.proposers,
                  invitees,
                });
                const meetingId = result?.id;
                trackEvent('UC-02', 'uc02_meeting_created_from_calendar', {
                  meeting_id: meetingId,
                  meeting_title: values.title,
                });
                const eventFromApi = mapCreatedMeetingToOutlookEvent(result);
                queryClient.setQueryData<OutlookTimelineEvent[]>(
                  ['outlook-timeline', 'uc02', startDateISO, endDateISO],
                  (old) =>
                    (old ?? []).map((e) =>
                      e.item_id === optimisticId ? eventFromApi : e
                    )
                );
                const meetingForCache = normalizedMeetingFromCreateResponse(result);
                queryClient.setQueryData<MeetingApiResponse>(['meeting', result.id], meetingForCache);
                if (selectedEventForDetails?.id === optimisticId) {
                  setSelectedEventForDetails(mapOutlookEventToCalendarEvent(eventFromApi));
                }
              }

              setSlotForNewMeeting(null);
              if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['outlook-timeline'] });
              }
            } catch (err: unknown) {
              if (!isEdit) {
                queryClient.invalidateQueries({ queryKey: ['outlook-timeline'] });
              }
              const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err as Error)?.message ||
                (isEdit ? 'حدث خطأ أثناء تحديث الاجتماع' : 'حدث خطأ أثناء إنشاء الاجتماع');
              setSlotFormError(message);
            } finally {
              setSlotFormSubmitting(false);
            }
          }}
          onCancel={() => {
            setSlotFormError(null);
            setSlotForNewMeeting(null);
          }}
        />
      )}
    </div>
  );
};
