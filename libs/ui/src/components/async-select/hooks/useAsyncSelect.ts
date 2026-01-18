import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  FetchOptionsFn,
  AsyncSelectOption,
  AsyncSelectState,
  UseAsyncSelectReturn,
} from '../types';
import { useDebounce } from './useDebounce';

/**
 * Main hook for async select functionality
 * Handles fetching, pagination, search, and caching
 */
export function useAsyncSelect<T = string>(
  fetchOptions: FetchOptionsFn<T>,
  pageSize: number = 20,
  searchDebounceMs: number = 300,
  enabled: boolean = true
): UseAsyncSelectReturn<T> {
  const [state, setState] = useState<AsyncSelectState<T>>({
    options: [],
    loading: false,
    error: null,
    hasMore: true,
    currentPage: 0,
    searchTerm: '',
    debouncedSearchTerm: '',
  });

  const debouncedSearchTerm = useDebounce(state.searchTerm, searchDebounceMs);

  // Abort controller for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cache for storing results per search query
  const cacheRef = useRef<Map<string, { options: AsyncSelectOption<T>[]; hasMore: boolean; page: number }>>(
    new Map()
  );

  // Update debounced search term in state
  useEffect(() => {
    setState((prev) => ({ ...prev, debouncedSearchTerm }));
  }, [debouncedSearchTerm]);

  // Reset pagination when search changes
  useEffect(() => {
    if (debouncedSearchTerm !== state.debouncedSearchTerm) {
      setState((prev) => ({
        ...prev,
        currentPage: 0,
        options: [],
        hasMore: true,
      }));
    }
  }, [debouncedSearchTerm, state.debouncedSearchTerm]);

  // Fetch options
  const fetchPage = useCallback(
    async (page: number, search?: string, append: boolean = false) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Check cache first (only for first page to avoid complexity)
      const cacheKey = search || '';
      if (page === 0) {
        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
          // Use cached data for first page
          setState((prev) => ({
            ...prev,
            options: cached.options,
            hasMore: cached.hasMore,
            currentPage: 0,
            loading: false,
            error: null,
          }));
          return;
        }
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await fetchOptions(search, page, pageSize);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Merge options if appending, otherwise use new data
        const allOptions = append
          ? [...state.options, ...response.data]
          : response.data;

        // Update cache (only cache first page)
        if (page === 0) {
          cacheRef.current.set(cacheKey, {
            options: response.data,
            hasMore: response.hasMore,
            page: 0,
          });
        }

        setState((prev) => ({
          ...prev,
          options: allOptions,
          hasMore: response.hasMore,
          currentPage: page,
          loading: false,
          error: null,
        }));
      } catch (error) {
        // Don't set error if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'An error occurred',
          loading: false,
        }));
      }
    },
    [fetchOptions, pageSize, state.options]
  );

  // Load initial page or refetch when search changes
  useEffect(() => {
    if (!enabled) return;

    const search = debouncedSearchTerm || undefined;
    fetchPage(0, search, false);
  }, [debouncedSearchTerm, enabled, fetchPage]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    const nextPage = state.currentPage + 1;
    const search = debouncedSearchTerm || undefined;
    await fetchPage(nextPage, search, true);
  }, [state.loading, state.hasMore, state.currentPage, debouncedSearchTerm, fetchPage]);

  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  // Reset function
  const reset = useCallback(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      options: [],
      loading: false,
      error: null,
      hasMore: true,
      currentPage: 0,
      searchTerm: '',
      debouncedSearchTerm: '',
    });

    // Clear cache
    cacheRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state: {
      ...state,
      debouncedSearchTerm,
    },
    actions: {
      loadMore,
      setSearchTerm,
      reset,
    },
  };
}
