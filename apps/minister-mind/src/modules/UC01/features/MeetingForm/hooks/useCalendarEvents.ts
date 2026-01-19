import { useQuery } from '@tanstack/react-query';
import { formatDateToISO } from '@shared/utils';
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

  // Format time as HH:MM
  const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  return {
    id: slot.id,
    // Use 'compulsory' type for available (UI styling), 'reserved' for unavailable
    type: slot.is_available ? 'compulsory' : 'reserved',
    // Override label to show "متاح" for available slots
    label: slot.is_available ? 'متاح' : 'محجوز',
    startTime,
    endTime,
    date: startDate,
    title: slot.is_available ? undefined : 'محجوز',
    // Track availability for disabled state
    is_available: slot.is_available,
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
  const startDateStr = formatDateToISO(startDate);
  const endDateStr = formatDateToISO(endDate);

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
  const events: CalendarEventData[] = data?.map(mapSlotToEvent) ?? [];

  return {
    events,
    isLoading,
    error,
    refetch,
  };
};

