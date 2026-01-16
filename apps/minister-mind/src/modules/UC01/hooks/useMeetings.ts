import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus } from '@shared/types';
import { getMeetings, GetMeetingsParams } from '../data/meetingsApi';
import { mapMeetingToCardData, MeetingDisplayData } from '../utils/meetingMapper';
import { PAGINATION, TAB_FILTER_MAP } from '../utils/constants';

interface UseMeetingsOptions {
  activeTab: MeetingStatus;
  searchValue: string;
  statusFilter: MeetingStatus | 'all';
  currentPage: number;
  itemsPerPage?: number;
}

interface UseMeetingsReturn {
  meetings: MeetingDisplayData[];
  isLoading: boolean;
  error: unknown;
  totalItems: number;
  totalPages: number;
}

export const useMeetings = ({
  activeTab,
  searchValue,
  statusFilter,
  currentPage,
  itemsPerPage = PAGINATION.ITEMS_PER_PAGE,
}: UseMeetingsOptions): UseMeetingsReturn => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, PAGINATION.DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Get tab filter configuration (status and owner_type)
  const tabFilter = useMemo(() => {
    return TAB_FILTER_MAP[activeTab];
  }, [activeTab]);

  // Determine the status and owner_type to use for API call
  // If statusFilter is set and not 'all', use it; otherwise use the tab status
  // Always use the tab's owner_type
  // Note: TypeScript string enums are already strings at runtime
  const apiFilters = useMemo(() => {
    const status = statusFilter && statusFilter !== 'all' 
      ? statusFilter 
      : tabFilter?.status;
    
    const owner_type = tabFilter?.owner_type;

    return {
      status: status as string | undefined,
      owner_type: owner_type as string | undefined,
    };
  }, [tabFilter, statusFilter]);

  // Calculate pagination values
  const skip = (currentPage - 1) * itemsPerPage;

  // Fetch meetings from API
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
    enabled: !!apiFilters.status && !!apiFilters.owner_type,
  });

  // Map API response to MeetingDisplayData
  const meetings: MeetingDisplayData[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items.map(mapMeetingToCardData);
  }, [meetingsResponse]);

  // Calculate total pages from API response
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
