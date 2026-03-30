import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus } from '@/modules/shared/types';
import { getMeetings, GetMeetingsParams } from '../data/meetingsApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import type { MeetingCardData } from '@/modules/shared/components/meeting-card';
import { PAGINATION, MeetingOwnerType } from '../utils/constants';

/** Single status, 'all', or array of statuses for multi-select filter. */
export type StatusFilterInput = MeetingStatus | 'all' | (MeetingStatus | string)[];

interface UseMeetingsOptions {
  searchValue: string;
  /** Single status, 'all', or array of statuses. When array, API is called with multiple status params. */
  statusFilter: StatusFilterInput;
  currentPage: number;
  itemsPerPage?: number;
  ownerType?: MeetingOwnerType;
}
interface UseMeetingsReturn {
  meetings: MeetingCardData[];
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

  const mapStatusToApi = (status: MeetingStatus | 'all' | string): string => {
    if (status === 'all') {
      return '';
    }
    if (status === MeetingStatus.RETURNED_FROM_CONTENT) {
      return 'RETURNED_FROM_CONTENT';
    }
    if (status === MeetingStatus.RETURNED_FROM_SCHEDULING) {
      return 'RETURNED_FROM_SCHEDULING';
    }
    return status as string;
  };

  const statusArrayForApi = useMemo((): string[] => {
    if (Array.isArray(statusFilter)) {
      return statusFilter.map(mapStatusToApi).filter(Boolean);
    }
    const single = mapStatusToApi(statusFilter);
    return single ? [single] : [];
  }, [statusFilter]);

  const apiFilters = useMemo(
    () => ({
      statusArray: statusArrayForApi,
      owner_type: ownerType as string,
    }),
    [statusArrayForApi, ownerType]
  );

  const skip = (currentPage - 1) * itemsPerPage;

  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['meetings', 'uc01', apiFilters.statusArray, apiFilters.owner_type, debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        owner_type: apiFilters.owner_type,
        skip: skip,
        limit: itemsPerPage,
      };
      if (apiFilters.statusArray.length > 0) {
        params.status = apiFilters.statusArray;
      }
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