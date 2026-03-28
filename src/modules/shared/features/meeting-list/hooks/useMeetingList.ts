import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginatedResponse } from '../types';

const DEFAULT_PAGE_SIZE = 10;

export interface UseMeetingListOptions<T> {
  queryKey: string[];
  queryFn: (params: Record<string, any>) => Promise<PaginatedResponse<T>>;
  fixedParams?: Record<string, any>;
  pageSize?: number;
}

export interface UseMeetingListReturn<T> {
  /** Raw items from API */
  items: T[];
  /** Total items count */
  total: number;
  /** Current page (1-based) */
  page: number;
  /** Total pages */
  totalPages: number;
  /** Items per page */
  limit: number;
  /** Search value (raw) */
  search: string;
  /** Debounced search value */
  debouncedSearch: string;
  /** Multi-select filter values */
  filters: Record<string, string[]>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object */
  error: Error | null;
  /** Set search */
  setSearch: (value: string) => void;
  /** Set page */
  setPage: (page: number) => void;
  /** Set filter values for a key */
  setFilter: (key: string, values: string[]) => void;
  /** Reset all filters */
  resetFilters: () => void;
  /** Refetch */
  refetch: () => void;
}

export function useMeetingList<T>({
  queryKey,
  queryFn,
  fixedParams = {},
  pageSize = DEFAULT_PAGE_SIZE,
}: UseMeetingListOptions<T>): UseMeetingListReturn<T> {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on search/filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  const skip = (page - 1) * pageSize;

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      ...fixedParams,
      skip,
      limit: pageSize,
    };
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    // Spread filter values
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        params[key] = values;
      }
    });
    return params;
  }, [fixedParams, skip, pageSize, debouncedSearch, filters]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...queryKey, debouncedSearch.trim(), page, filters],
    queryFn: () => queryFn(queryParams),
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const setFilter = useCallback((key: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    items,
    total,
    page,
    totalPages,
    limit: pageSize,
    search,
    debouncedSearch,
    filters,
    isLoading,
    isError,
    error: error as Error | null,
    setSearch,
    setPage,
    setFilter,
    resetFilters,
    refetch,
  };
}
