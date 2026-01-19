import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ScreenLoader } from '@shared';
import { MeetingStatus } from '@shared';
import {
  WeeklyCalendarNavigation,
  WeeklyCalendarGrid,
  type CalendarEventData,
} from '../../UC01/features/NewMeeting/steps/Step3/components';
import { getMeetings, type MeetingApiResponse } from '../data/meetingsApi';
import { PATH } from '../routes/paths';

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Reset to start of day
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday as first day
  return new Date(d.setDate(diff));
};

const getWeekEnd = (weekStart: Date): Date => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get Sunday
  weekEnd.setHours(23, 59, 59, 999); // Set to end of day
  return weekEnd;
};

/**
 * Convert meeting to CalendarEventData format
 */
const mapMeetingToEvent = (meeting: MeetingApiResponse): CalendarEventData | null => {
  // Try to use selected_time_slot first, then fall back to scheduled_at
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  
  if (meeting.selected_time_slot?.slot_start) {
    startDate = new Date(meeting.selected_time_slot.slot_start);
    endDate = meeting.selected_time_slot.slot_end 
      ? new Date(meeting.selected_time_slot.slot_end)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // Default to 1 hour if no end time
  } else if (meeting.scheduled_at) {
    // Use scheduled_at as start time
    startDate = new Date(meeting.scheduled_at);
    // Calculate end time: scheduled_at + presentation_duration (in minutes)
    const durationMinutes = meeting.presentation_duration || 60; // Default to 60 minutes if not specified
    endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  } else {
    // If no date available, skip this meeting
    return null;
  }
  
  // Validate the date
  if (isNaN(startDate.getTime())) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Invalid date for meeting:', meeting.id, {
        scheduled_at: meeting.scheduled_at,
        selected_time_slot: meeting.selected_time_slot,
      });
    }
    return null;
  }
  
  // Format time as HH:MM - use actual time from dates
  // Calendar time slots are: 00:00, 01:00, 02:00, ..., 23:00 (all 24 hours)
  // Find the hour slot that contains the scheduled time (round down for start, round up for end)
  const formatTimeToSlot = (date: Date, roundUp: boolean = false): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    // Round down to nearest hour for start, round up for end
    let slotHour = roundUp && minutes > 0 ? hours + 1 : hours;
    // Clamp to valid hour range (0-23)
    slotHour = Math.max(0, Math.min(23, slotHour));
    return `${slotHour.toString().padStart(2, '0')}:00`;
  };
  
  // Format exact time with minutes (HH:MM)
  const formatExactTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Calculate start and end times based on actual scheduled time
  const startTime = formatTimeToSlot(startDate, false);
  // For end time, ensure it's at least one slot after start time if duration > 0
  let endTime = endDate ? formatTimeToSlot(endDate, true) : startTime;
  
  // Ensure end time is after start time (at least one hour slot difference)
  // This handles cases where both times might be clamped to the same boundary
  if (endTime === startTime && endDate && endDate > startDate) {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = Math.min(23, startHour + 1); // At least one hour later, max 23:00
    endTime = `${endHour.toString().padStart(2, '0')}:00`;
  }
  
  // Calculate exact times with minutes for display in popover
  const exactStartTime = formatExactTime(startDate);
  const exactEndTime = endDate ? formatExactTime(endDate) : exactStartTime;
  
  // Use meeting title or subject as the label
  const meetingTitle = meeting.meeting_title || meeting.meeting_subject || 'اجتماع';
  
  return {
    id: meeting.id,
    type: 'reserved', // Scheduled meetings are always reserved/booked
    label: meetingTitle,
    startTime,
    endTime,
    date: startDate,
    title: meetingTitle,
    description: meeting.meeting_subject || undefined,
    is_available: false, // Scheduled meetings are not available
    exactStartTime, // Exact time with minutes for popover display
    exactEndTime, // Exact time with minutes for popover display
  };
};

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  // Set default week to current date
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  // Fetch scheduled meetings - fetch all and filter client-side
  // Note: We fetch all scheduled meetings and filter by date range on the client side
  // since the API doesn't support date range filtering
  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['calendar-meetings', 'uc02'],
    queryFn: () => {
      return getMeetings({
        status: MeetingStatus.SCHEDULED,
        owner_type: 'SCHEDULING',
        limit: 1000, // Fetch a large number to get all scheduled meetings
      });
    },
    enabled: true,
  });

  // Map meetings to calendar events and filter by week
  const events: CalendarEventData[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    
    // Map all meetings that have dates
    const allMappedEvents = meetingsResponse.items
      .map(mapMeetingToEvent)
      .filter((event): event is CalendarEventData => event !== null);
    
    // Normalize week boundaries - compare only dates (ignore time)
    const weekStartDate = new Date(weekStart);
    weekStartDate.setHours(0, 0, 0, 0);
    const weekStartTime = weekStartDate.getTime();
    
    const weekEndDate = new Date(weekEnd);
    weekEndDate.setHours(23, 59, 59, 999);
    const weekEndTime = weekEndDate.getTime();
    
    // Filter events that fall within the current week
    const filteredEvents = allMappedEvents.filter((event) => {
      // Compare only the date part, ignoring time
      const eventDateOnly = new Date(event.date);
      eventDateOnly.setHours(0, 0, 0, 0);
      const eventTime = eventDateOnly.getTime();
      return eventTime >= weekStartTime && eventTime <= weekEndTime;
    });
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      const meetingsWithSlots = meetingsResponse.items.filter(m => m.selected_time_slot?.slot_start).length;
      const meetingsWithScheduledAt = meetingsResponse.items.filter(m => m.scheduled_at).length;
      const sampleDates = meetingsResponse.items
        .slice(0, 5)
        .map(m => ({ 
          id: m.id, 
          scheduled_at: m.scheduled_at, 
          hasSlot: !!m.selected_time_slot?.slot_start,
          slotStart: m.selected_time_slot?.slot_start,
        }));
      
      console.log('Calendar Debug:', {
        currentDate: currentDate.toISOString(),
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalMeetings: meetingsResponse.items.length,
        meetingsWithSlots,
        meetingsWithScheduledAt,
        allMappedCount: allMappedEvents.length,
        filteredEventsCount: filteredEvents.length,
        sampleDates,
        sampleMappedDates: allMappedEvents.slice(0, 5).map(e => ({
          id: e.id,
          date: e.date.toISOString(),
          dateOnly: new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate()).toISOString(),
          inRange: (() => {
            const ed = new Date(e.date);
            ed.setHours(0, 0, 0, 0);
            return ed.getTime() >= weekStartTime && ed.getTime() <= weekEndTime;
          })()
        }))
      });
    }
    
    return filteredEvents;
  }, [meetingsResponse, weekStart, weekEnd, currentDate]);

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

  const handleEventClick = useCallback((event: CalendarEventData) => {
    // Navigate to meeting detail page
    navigate(PATH.MEETING_DETAIL.replace(':id', event.id));
  }, [navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <ScreenLoader />
      </div>
    );
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="w-full flex flex-col items-center mt-12" dir="rtl">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1085px] flex flex-col gap-6 p-6">
            <div className="text-center text-red-600 p-4">
              حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1085px] flex flex-col gap-6">
            {/* Navigation */}
            <WeeklyCalendarNavigation
              currentDate={currentDate}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
            />

            {/* Calendar Grid */}
            <WeeklyCalendarGrid
              weekStart={weekStart}
              events={events}
              onEventClick={handleEventClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;

