import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus } from '@shared/types';
import { getMeetings, GetMeetingsParams } from '../data/meetingsApi';
import { mapMeetingToCardData, MeetingDisplayData } from '../utils/meetingMapper';
import { PAGINATION, TAB_STATUS_MAP } from '../utils/constants';

interface UseMeetingsOptions {
  activeTab: string;
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

/**
 * Custom hook for fetching and managing meetings list
 */
export const useMeetings = ({
  activeTab,
  searchValue,
  statusFilter,
  currentPage,
  itemsPerPage = PAGINATION.ITEMS_PER_PAGE,
}: UseMeetingsOptions): UseMeetingsReturn => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, PAGINATION.DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Determine API status based on active tab
  const apiStatus = useMemo(() => {
    return TAB_STATUS_MAP[activeTab];
  }, [activeTab]);

  // Determine the status to use for API call
  // If statusFilter is set and not 'all', use it; otherwise use the tab status
  const apiStatusToUse = useMemo(() => {
    if (statusFilter && statusFilter !== 'all') {
      return statusFilter;
    }
    return apiStatus;
  }, [apiStatus, statusFilter]);

  // Calculate pagination values
  const skip = (currentPage - 1) * itemsPerPage;

  // Fetch meetings from API
  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['meetings', 'uc01', apiStatusToUse, debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        status: apiStatusToUse,
        owner_type: 'SCHEDULING',
        skip: skip,
        limit: itemsPerPage,
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getMeetings(params);
    },
    enabled: !!apiStatusToUse,
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
