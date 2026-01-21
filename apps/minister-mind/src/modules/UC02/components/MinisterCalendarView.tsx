import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScreenLoader } from '@shared';
import { MeetingStatus } from '@shared';
import {
  WeeklyCalendarNavigation,
  WeeklyCalendarGrid,
  type CalendarEventData,
} from '@shared';
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

  // Sync currentDate if initialDate changes (e.g. when opening modal with a new selection)
  React.useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['calendar-meetings', 'uc02'],
    queryFn: () => {
      return getMeetings({
        status: MeetingStatus.SCHEDULED,
        owner_type: 'SCHEDULING',
        limit: 1000,
      });
    },
    enabled: true,
  });

  const events: CalendarEventData[] = useMemo(() => {
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

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center" dir="rtl">
        <ScreenLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center text-red-600" dir="rtl">
        حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6" dir="rtl">
      <WeeklyCalendarNavigation
        currentDate={currentDate}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
      />

      <WeeklyCalendarGrid
        weekStart={weekStart}
        events={events}
        onEventClick={(event) => {
          // In modal context, we might not want to navigate away, 
          // or we can open meeting details in a new tab
          window.open(`/meeting/${event.id}`, '_blank');
        }}
      />
    </div>
  );
};
