import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus } from '@shared/types';
import { getMeetings, GetMeetingsParams } from '../data/meetingsApi';
import { mapMeetingToCardData, MeetingDisplayData } from '../utils/meetingMapper';
import { PAGINATION, MeetingOwnerType } from '../utils/constants';

interface UsePreviousMeetingsOptions {
  searchValue: string;
  currentPage: number;
  itemsPerPage?: number;
}

interface UsePreviousMeetingsReturn {
  meetings: MeetingDisplayData[];
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
        date_now: new Date().toISOString().split('T')[0] + 'T00:00:00',
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
