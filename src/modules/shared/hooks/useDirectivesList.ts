/**
 * Shared hook for fetching minister directives with filters, pagination, and tab counts.
 */
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listDirectives,
  takeDirective as takeDirectiveApi,
  requestMeetingFromDirective as requestMeetingApi,
  type MinisterDirective,
  type ListDirectivesParams,
} from '@/modules/shared/api/directives';
import type { DirectiveStatus, DirectiveType } from '@/modules/shared/types/minister-directive-enums';

const PAGE_SIZE = 10;

export interface UseDirectivesListOptions {
  /** Fixed directive_type filter (e.g. 'SCHEDULING' for UC-02) */
  fixedDirectiveType?: DirectiveType;
  /** Initial active type tab (for UC-19 type tabs). Omit or `undefined` = no type filter (“all”). */
  defaultTypeTab?: DirectiveType | undefined;
  /** Whether to use type tabs (UC-19) or status tabs (UC-02) */
  tabMode: 'type' | 'status';
  /** Default status filter */
  defaultStatus?: DirectiveStatus;
  /** Additional fixed params always sent to API */
  fixedParams?: Partial<ListDirectivesParams>;
  /** Query key prefix */
  queryKeyPrefix: string;
  /** Status tabs to show counts for */
  statusTabs?: DirectiveStatus[];
  pageSize?: number;
}

export function useDirectivesList(options: UseDirectivesListOptions) {
  const {
    fixedDirectiveType,
    defaultTypeTab,
    tabMode,
    defaultStatus,
    fixedParams = {},
    queryKeyPrefix,
    statusTabs,
    pageSize = PAGE_SIZE,
  } = options;

  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeType, setActiveType] = useState<DirectiveType | undefined>(defaultTypeTab);
  const [activeStatus, setActiveStatus] = useState<DirectiveStatus | undefined>(defaultStatus);

  // Build API params
  const apiParams: ListDirectivesParams = {
    ...fixedParams,
    skip: (currentPage - 1) * pageSize,
    limit: pageSize,
    ...(fixedDirectiveType ? { directive_type: fixedDirectiveType } : {}),
    ...(tabMode === 'type' && activeType ? { directive_type: activeType } : {}),
    ...(tabMode === 'status' && activeStatus ? { status: activeStatus } : {}),
  };

  const queryKey = [queryKeyPrefix, 'list', apiParams];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => listDirectives(apiParams),
  });

  // Status counts (for UC-02 tab badges)
  const statusCountQueries = (statusTabs || []).map((status) => {
    const countParams: ListDirectivesParams = {
      ...fixedParams,
      ...(fixedDirectiveType ? { directive_type: fixedDirectiveType } : {}),
      status,
      skip: 0,
      limit: 1,
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: [queryKeyPrefix, 'count', status, fixedDirectiveType],
      queryFn: () => listDirectives(countParams),
    });
  });

  const statusCounts: Record<string, number> = {};
  (statusTabs || []).forEach((status, i) => {
    statusCounts[status] = statusCountQueries[i]?.data?.total ?? 0;
  });

  const directives = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleTypeChange = useCallback((type: DirectiveType | undefined) => {
    setActiveType(type);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((status: DirectiveStatus) => {
    setActiveStatus(status);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTakeDirective = useCallback(async (directive: MinisterDirective) => {
    try {
      await takeDirectiveApi(directive.id);
      toast.success('تم الأخذ بالتوجيه');
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
    } catch {
      toast.error('حدث خطأ');
    }
  }, [queryClient, queryKeyPrefix]);

  const handleRequestMeeting = useCallback(async (directive: MinisterDirective) => {
    try {
      await requestMeetingApi(directive.id);
    } catch {
      // Handled by caller
    }
    return { directiveId: directive.id, directiveText: directive.title };
  }, []);

  return {
    directives,
    total,
    totalPages,
    currentPage,
    isLoading,
    error,
    activeType,
    activeStatus,
    statusCounts,
    handleTypeChange,
    handleStatusChange,
    handlePageChange,
    handleTakeDirective,
    handleRequestMeeting,
    invalidate: () => queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] }),
  };
}
