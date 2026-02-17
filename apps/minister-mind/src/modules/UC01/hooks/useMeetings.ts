import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus } from '@shared/types';
import { getMeetings, GetMeetingsParams } from '../data/meetingsApi';
import { mapMeetingToCardData, MeetingDisplayData } from '../utils/meetingMapper';
import { PAGINATION, TAB_FILTER_MAP, MeetingOwnerType } from '../utils/constants';

interface UseMeetingsOptions {
  searchValue: string;
  statusFilter?: MeetingStatus | 'all';
  currentPage: number;
  itemsPerPage?: number;
  /** Optional: when not provided, uses SUBMITTER and status from statusFilter (or all when statusFilter is 'all') */
  activeTab?: MeetingStatus;
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
  activeTab,
}: UseMeetingsOptions): UseMeetingsReturn => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, PAGINATION.DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const tabFilter = useMemo(() => {
    return activeTab != null ? TAB_FILTER_MAP[activeTab] : undefined;
  }, [activeTab]);

  const mapStatusToApi = (status: MeetingStatus | string | undefined): string | undefined => {
    if (!status) return undefined;
    
    if (status === MeetingStatus.RETURNED_FROM_CONTENT) {
      return 'RETURNED_FROM_CONTENT';
    } else if (status === MeetingStatus.RETURNED_FROM_SCHEDULING) {
      return 'RETURNED_FROM_SCHEDULING';
    }
    return status as string;
  };

  const apiFilters = useMemo(() => {
    let status: string | undefined;
    let owner_type: string | undefined;

    if (tabFilter) {
      owner_type = tabFilter.owner_type as string;
      if (statusFilter && statusFilter !== 'all') {
        status = mapStatusToApi(statusFilter);
      } else {
        if (activeTab === MeetingStatus.RETURNED_FROM_CONTENT) {
          status = 'RETURNED_FROM_CONTENT';
        } else if (activeTab === MeetingStatus.RETURNED_FROM_SCHEDULING) {
          status = 'RETURNED_FROM_SCHEDULING';
        } else {
          status = tabFilter.status as string;
        }
      }
    } else {
      owner_type = MeetingOwnerType.SUBMITTER;
      if (statusFilter && statusFilter !== 'all') {
        status = mapStatusToApi(statusFilter);
      }
    }

    return {
      status: status as string | undefined,
      owner_type,
    };
  }, [tabFilter, statusFilter, activeTab]);

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
    enabled: !!apiFilters.owner_type,
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
