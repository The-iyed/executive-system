import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus } from '@/modules/shared/types';
import { toISOStringWithTimezone } from '@/lib/ui';
import { getMeetings, GetMeetingsParams } from '../data/meetingsApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import type { MeetingCardData } from '@/modules/shared/components/meeting-card';
import { PAGINATION } from '../utils/constants';

interface UsePreviousMeetingsOptions {
  searchValue: string;
  currentPage: number;
  itemsPerPage?: number;
}

interface UsePreviousMeetingsReturn {
  meetings: MeetingCardData[];
  isLoading: boolean;
  error: unknown;
  totalItems: number;
  totalPages: number;
}

export const usePreviousMeetings = ({
  searchValue,
  currentPage,
  itemsPerPage = PAGINATION.ITEMS_PER_PAGE,
}: UsePreviousMeetingsOptions): UsePreviousMeetingsReturn => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, PAGINATION.DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const skip = (currentPage - 1) * itemsPerPage;

  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['meetings', 'uc01', 'previous', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        status: MeetingStatus.CLOSED,
        // owner_type: MeetingOwnerType.SUBMITTER,
        skip,
        limit: itemsPerPage,
        date_now: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return toISOStringWithTimezone(d); })(),
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getMeetings(params);
    },
    enabled: true,
  });

  const meetings: MeetingDisplayData[] = meetingsResponse?.items
    ? meetingsResponse.items.map(mapMeetingToCardData)
    : [];
  const totalItems = meetingsResponse?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    meetings,
    isLoading,
    error,
    totalItems,
    totalPages,
  };
};
