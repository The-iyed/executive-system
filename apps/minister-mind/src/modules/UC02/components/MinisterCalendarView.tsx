import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScreenLoader } from '@shared';
import { MeetingStatus } from '@shared';
import {
  WeeklyCalendarNavigation,
  WeeklyCalendarGrid,
  type CalendarEventData,
} from '@shared';
import { Skeleton } from '@sanad-ai/ui';
import { getMeetings, type MeetingApiResponse } from '../data/meetingsApi';

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekEnd = (weekStart: Date): Date => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

const getRandomVariant = (id: string): string => {
  const variants = ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % variants.length;
  return variants[index];
};

const mapMeetingToEvent = (meeting: MeetingApiResponse): CalendarEventData | null => {
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  
  if (meeting.selected_time_slot?.slot_start) {
    startDate = new Date(meeting.selected_time_slot.slot_start);
    endDate = meeting.selected_time_slot.slot_end 
      ? new Date(meeting.selected_time_slot.slot_end)
      : new Date(startDate.getTime() + 60 * 60 * 1000);
  } else if (meeting.scheduled_at) {
    startDate = new Date(meeting.scheduled_at);
    const durationMinutes = meeting.presentation_duration || 60;
    endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  } else {
    return null;
  }
  
  if (isNaN(startDate.getTime())) return null;
  
  const formatTimeToSlot = (date: Date, roundUp: boolean = false): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    let slotHour = roundUp && minutes > 0 ? hours + 1 : hours;
    slotHour = Math.max(0, Math.min(23, slotHour));
    return `${slotHour.toString().padStart(2, '0')}:00`;
  };
  
  const formatExactTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const startTime = formatTimeToSlot(startDate, false);
  let endTime = endDate ? formatTimeToSlot(endDate, true) : startTime;
  
  if (endTime === startTime && endDate && endDate > startDate) {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = Math.min(23, startHour + 1);
    endTime = `${endHour.toString().padStart(2, '0')}:00`;
  }
  
  const exactStartTime = formatExactTime(startDate);
  const exactEndTime = endDate ? formatExactTime(endDate) : exactStartTime;
  const meetingTitle = meeting.meeting_title || meeting.meeting_subject || 'اجتماع';
  
  return {
    id: meeting.id,
    type: 'reserved',
    variant: getRandomVariant(meeting.id),
    label: meetingTitle,
    startTime,
    endTime,
    date: startDate,
    title: meetingTitle,
    description: meeting.meeting_subject || undefined,
    is_available: false,
    exactStartTime,
    exactEndTime,
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
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  // Keep previous events while loading new week
  const [previousEvents, setPreviousEvents] = useState<CalendarEventData[]>([]);

  // Sync currentDate if initialDate changes (e.g. when opening modal with a new selection)
  React.useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  // Format dates as ISO strings for API
  const startDateISO = useMemo(() => {
    const date = new Date(weekStart);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }, [weekStart]);

  const endDateISO = useMemo(() => {
    const date = new Date(weekEnd);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }, [weekEnd]);

  const { data: meetingsResponse, isLoading, isFetching, error } = useQuery({
    queryKey: ['calendar-meetings', 'uc02', startDateISO, endDateISO],
    queryFn: () => {
      return getMeetings({
        status: MeetingStatus.SCHEDULED,
        owner_type: 'SCHEDULING',
        start_date: startDateISO,
        end_date: endDateISO,
      });
    },
    enabled: true,
  });

  // Process new events from API response
  const processedEvents = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    
    const allMappedEvents = meetingsResponse.items
      .map(mapMeetingToEvent)
      .filter((event): event is CalendarEventData => event !== null);
    
    const weekStartDate = new Date(weekStart);
    weekStartDate.setHours(0, 0, 0, 0);
    const weekStartTime = weekStartDate.getTime();
    
    const weekEndDate = new Date(weekEnd);
    weekEndDate.setHours(23, 59, 59, 999);
    const weekEndTime = weekEndDate.getTime();
    
    const filtered = allMappedEvents.filter((event) => {
      const eventDateOnly = new Date(event.date);
      eventDateOnly.setHours(0, 0, 0, 0);
      const eventTime = eventDateOnly.getTime();
      return eventTime >= weekStartTime && eventTime <= weekEndTime;
    });

    return [...filtered, ...extraEvents];
  }, [meetingsResponse, weekStart, weekEnd, extraEvents]);

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
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  }, []);

  // Track if we've ever loaded data successfully
  const hasLoadedOnce = React.useRef(false);
  React.useEffect(() => {
    if (meetingsResponse && !isFetching) {
      hasLoadedOnce.current = true;
    }
  }, [meetingsResponse, isFetching]);

  // Show full loader only on the very first load when we've never loaded data before
  const isInitialLoad = isLoading && !hasLoadedOnce.current && previousEvents.length === 0 && !error;

  if (isInitialLoad) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center" dir="rtl">
        <ScreenLoader />
      </div>
    );
  }

  // Show error only on initial load with no previous data
  if (error && !meetingsResponse && previousEvents.length === 0 && !hasLoadedOnce.current) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center text-red-600" dir="rtl">
        حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  // Calendar skeleton component for loading state
  const CalendarSkeleton = () => {
    const weekDates = useMemo(() => {
      const dates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(date);
      }
      return dates;
    }, [weekStart]);

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
      <div className="w-full border-[0.6px] border-b-0 border-[#B6C1CA] rounded-[2px] overflow-hidden bg-white">
        {/* Header Row - Days */}
        <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b-[0.6px] border-[#B6C1CA] bg-[#FFFFFF]">
          <div className="p-3 border-[#B6C1CA] bg-[#F9FAFB]" />
          {weekDates.map((_date, index) => (
            <div key={index} className="p-1 border-r-[0.6px] border-[#B6C1CA] text-right h-[50px]">
              <Skeleton className="h-4 w-6 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
          {timeSlots.map((time, timeIndex) => (
            <React.Fragment key={time}>
              {/* Time Label */}
              <div className="p-3 border-r-0 border-b-[0.6px] border-[#B6C1CA] bg-[#F9FAFB] text-right w-[60px]">
                <Skeleton className="h-4 w-10" />
              </div>

              {/* Day Columns */}
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
                    className="border-r-[0.6px] border-b-[0.6px] border-[#B6C1CA] h-[50px] relative"
                  >
                    {hasSkeletonEvent && skeletonEvent && (
                      <div
                        className="absolute left-1 right-1 rounded px-2 py-1"
                        style={{
                          top: '2px',
                          height: `${skeletonEvent.height * 50 - 4}px`,
                        }}
                      >
                        <Skeleton className="h-full w-full rounded" />
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Always show the calendar structure - never remove it after initial load
  return (
    <div className="w-full flex flex-col gap-6 relative" dir="rtl">
      <WeeklyCalendarNavigation
        currentDate={currentDate}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
      />

      <div className="relative">
        {/* Show skeleton only on initial load when we have no data at all */}
        {isInitialLoad ? (
          <CalendarSkeleton />
        ) : (
          <>
            <WeeklyCalendarGrid
              weekStart={weekStart}
              events={events}
              startHour={0}
              endHour={23}
              onEventClick={(event) => {
                // In modal context, we might not want to navigate away, 
                // or we can open meeting details in a new tab
                window.open(`/meeting/${event.id}`, '_blank');
              }}
            />
            
            {/* Subtle loading indicator when fetching new week data */}
            {isFetching && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs text-gray-700 font-medium" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    جاري التحديث...
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error message overlay if there's an error but we have previous data */}
      {error && (meetingsResponse || previousEvents.length > 0) && (
        <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-20">
          <p className="text-sm text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
            حدث خطأ أثناء تحديث المواعيد. يرجى المحاولة مرة أخرى.
          </p>
        </div>
      )}
    </div>
  );
};
