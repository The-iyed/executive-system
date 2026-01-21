import { useQuery } from '@tanstack/react-query';
import { getCalendarEvents, type GetCalendarEventsParams } from '../../../data/calendarApi';
import type { CalendarEventData } from '@shared';

/**
 * Convert API slot to CalendarEventData format
 */
const mapSlotToEvent = (slot: {
  id: string;
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}): CalendarEventData => {
  const startDate = new Date(slot.slot_start);
  const endDate = new Date(slot.slot_end);

  // Format time for grid positioning (must match HH:00 slots)
  const startTime = `${startDate.getHours().toString().padStart(2, '0')}:00`;
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:00`;

  // Format exact time for display
  const exactStartTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
  const exactEndTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

  return {
    id: slot.id,
    type: slot.is_available ? 'compulsory' : 'reserved',
    label: slot.is_available ? 'متاح' : 'محجوز',
    startTime,
    endTime,
    date: startDate,
    title: slot.is_available ? 'موعد متاح' : 'محجوز',
    is_available: slot.is_available,
    exactStartTime,
    exactEndTime,
  };
};

interface UseCalendarEventsOptions {
  startDate: Date;
  endDate: Date;
  durationMinutes?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch calendar events for a date range
 */
export const useCalendarEvents = ({
  startDate,
  endDate,
  durationMinutes = 60,
  enabled = true,
}: UseCalendarEventsOptions) => {
  // Format dates as ISO strings (YYYY-MM-DD) using local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startDateStr = formatLocalDate(startDate);
  const endDateStr = formatLocalDate(endDate);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-events', startDateStr, endDateStr, durationMinutes],
    queryFn: () => {
      const params: GetCalendarEventsParams = {
        start_date: startDateStr,
        end_date: endDateStr,
        duration_minutes: durationMinutes,
      };
      return getCalendarEvents(params);
    },
    enabled: enabled && !!startDate && !!endDate,
  });

  // Map API response to CalendarEventData
  const events: CalendarEventData[] = data?.map(mapSlotToEvent) || [];

  return {
    events,
    isLoading,
    error,
    refetch,
  };
};

