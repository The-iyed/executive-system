import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMeetingsTimeline,
  getDayRange,
  getWeekRange,
  getMonthRange,
  toISORange,
  type CalendarTimelineEvent,
} from '@/api/meetings/getMeetingsTimeline';
import type { CalendarViewMode } from '../types';

const STALE_TIME = 2 * 60 * 1000;
const QUERY_KEY_PREFIX = 'calendar-timeline' as const;

export function useCalendarEvents(currentDate: Date, viewMode: CalendarViewMode) {
  const queryClient = useQueryClient();

  const { startISO, endISO } = useMemo(() => {
    const range = viewMode === 'monthly' ? getMonthRange(currentDate) : getWeekRange(currentDate);
    return toISORange(range);
  }, [currentDate, viewMode]);

  const queryKey = useMemo(
    () => [QUERY_KEY_PREFIX, startISO, endISO] as const,
    [startISO, endISO],
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: () => getMeetingsTimeline(startISO, endISO),
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  });

  const events: CalendarTimelineEvent[] = data ?? [];

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PREFIX] });
  }, [queryClient]);

  return {
    events,
    isLoading,
    isFetching,
    error,
    invalidate,
    queryKey,
  };
}
