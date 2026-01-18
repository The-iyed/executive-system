/**
 * Type definitions for AsyncSelect component
 */

/**
 * Option structure for AsyncSelect
 */
export interface AsyncSelectOption<T = string> {
  id: string;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  // Allow additional data to be attached
  data?: T;
}

/**
 * Paginated API response contract
 */
export interface PaginatedResponse<T> {
  data: Array<T>;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * Function to fetch options from API
 */
export type FetchOptionsFn<T = string> = (
  search?: string,
  page?: number,
  pageSize?: number
) => Promise<PaginatedResponse<AsyncSelectOption<T>>>;

/**
 * Single select mode props
 */
export interface SingleSelectProps<T = string> {
  multiple?: false;
  value?: T;
  onValueChange?: (value: T | undefined) => void;
}

/**
 * Multi select mode props
 */
export interface MultiSelectProps<T = string> {
  multiple: true;
  value?: T[];
  onValueChange?: (value: T[]) => void;
}

/**
 * Base props for AsyncSelect
 */
export interface AsyncSelectBaseProps<T = string> {
  /**
   * Function to fetch options from API
   */
  fetchOptions: FetchOptionsFn<T>;

  /**
   * Initial page size
   * @default 20
   */
  pageSize?: number;

  /**
   * Debounce delay for search input (ms)
   * @default 300
   */
  searchDebounceMs?: number;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the select is disabled
   */
  disabled?: boolean;

  /**
   * Custom className for the trigger button
   */
  className?: string;

  /**
   * Custom className for the popover content
   */
  popoverClassName?: string;

  /**
   * Custom width for the popover
   */
  width?: string | number;

  /**
   * Whether to enable search
   * @default true
   */
  searchable?: boolean;

  /**
   * Search placeholder
   */
  searchPlaceholder?: string;

  /**
   * Custom empty message
   */
  emptyMessage?: string;

  /**
   * Custom error message
   */
  errorMessage?: string | null;

  /**
   * Custom render function for each option
   */
  renderOption?: (option: AsyncSelectOption<T>) => React.ReactNode;

  /**
   * Custom render function for selected value display
   */
  renderSelected?: (option: AsyncSelectOption<T> | null) => React.ReactNode;

  /**
   * Custom render function for multi-select selected values
   */
  renderMultiSelected?: (options: AsyncSelectOption<T>[]) => React.ReactNode;

  /**
   * Allow clearing selection
   * @default false
   */
  clearable?: boolean;

  /**
   * Maximum height of the options list
   * @default 300
   */
  maxHeight?: number;

  /**
   * Threshold for loading more items (px from bottom)
   * @default 100
   */
  loadMoreThreshold?: number;
}

/**
 * Combined props type
 */
export type AsyncSelectProps<T = string> = AsyncSelectBaseProps<T> &
  (SingleSelectProps<T> | MultiSelectProps<T>);

/**
 * Internal state for async select
 */
export interface AsyncSelectState<T = string> {
  options: AsyncSelectOption<T>[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  searchTerm: string;
  debouncedSearchTerm: string;
}

/**
 * Return type for useAsyncSelect hook
 */
export interface UseAsyncSelectReturn<T = string> {
  state: AsyncSelectState<T>;
  actions: {
    loadMore: () => Promise<void>;
    setSearchTerm: (term: string) => void;
    reset: () => void;
  };
}
