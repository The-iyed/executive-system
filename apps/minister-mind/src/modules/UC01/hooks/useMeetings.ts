import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus } from '@shared/types';
import { getMeetings, GetMeetingsParams } from '../data/meetingsApi';
import { mapMeetingToCardData, MeetingDisplayData } from '../utils/meetingMapper';
import { PAGINATION, MeetingOwnerType } from '../utils/constants';

interface UseMeetingsOptions {
  searchValue: string;
  statusFilter: MeetingStatus;
  currentPage: number;
  itemsPerPage?: number;
  ownerType?: MeetingOwnerType;
}
interface UseMeetingsReturn {
  meetings: MeetingDisplayData[];
  isLoading: boolean;
  error: unknown;
  totalItems: number;
  totalPages: number;
}

export const useMeetings = ({
  searchValue,
  statusFilter,
  currentPage,
  itemsPerPage = PAGINATION.ITEMS_PER_PAGE,
  ownerType = MeetingOwnerType.SUBMITTER,
}: UseMeetingsOptions): UseMeetingsReturn => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, PAGINATION.DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const mapStatusToApi = (status: MeetingStatus | string): string => {
    if (status === MeetingStatus.RETURNED_FROM_CONTENT) {
      return 'RETURNED_FROM_CONTENT';
    }
    if (status === MeetingStatus.RETURNED_FROM_SCHEDULING) {
      return 'RETURNED_FROM_SCHEDULING';
    }
    return status as string;
  };

  const apiFilters = useMemo(
    () => ({
      status: mapStatusToApi(statusFilter),
      owner_type: ownerType as string,
    }),
    [statusFilter, ownerType]
  );

  const skip = (currentPage - 1) * itemsPerPage;

  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['meetings', 'uc01', apiFilters.status, apiFilters.owner_type, debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        status: apiFilters.status,
        owner_type: apiFilters.owner_type,
        skip: skip,
        limit: itemsPerPage,
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getMeetings(params);
    },
    enabled: true,
  });

  const meetings: MeetingDisplayData[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items.map(mapMeetingToCardData);
  }, [meetingsResponse]);

  const totalItems = meetingsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    meetings,
    isLoading,
    error,
    totalItems,
    totalPages,
  };
};