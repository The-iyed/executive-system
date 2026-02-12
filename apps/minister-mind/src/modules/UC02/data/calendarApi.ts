import axiosInstance from '@auth/utils/axios';

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

