import axiosInstance from '@auth/utils/axios';

export interface CalendarSlot {
  id: string;
  slot_start: string;
  slot_end: string;
  is_available: boolean;
  is_selected?: boolean;
}

export interface GetCalendarEventsParams {
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  duration_minutes?: number;
}

/**
 * API function to fetch calendar events for a date range
 * Uses start_date and end_date for filtering instead of pagination (page/limit/skip)
 */
export const getCalendarEvents = async (
  params: GetCalendarEventsParams
): Promise<CalendarSlot[]> => {
  const { start_date, end_date, duration_minutes = 60 } = params;
  
  const response = await axiosInstance.get<CalendarSlot[]>(
    '/api/meeting-requests/drafts/available-time-slots',
    {
      params: {
        start_date,
        end_date,
        duration_minutes,
        // Note: This API uses date range filtering (start_date/end_date) 
        // instead of pagination parameters (page/limit/skip)
      },
    }
  );
  
  return response.data;
};

