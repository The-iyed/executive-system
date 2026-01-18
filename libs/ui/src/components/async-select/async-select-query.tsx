import * as React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/popover';
import { useDebounce } from './hooks/useDebounce';
import { useInfinitePagination } from './hooks/useInfinitePagination';
import type { AsyncSelectOption, PaginatedResponse } from './types';

/**
 * Loading skeleton component
 */
function LoadingSkeleton() {
  return (
    <CommandGroup>
      {[1, 2, 3].map((i) => (
        <CommandItem key={i} disabled>
          <div className="flex items-center gap-2 w-full">
            <div className="h-4 w-4 rounded animate-pulse bg-muted" />
            <div className="h-4 w-32 animate-pulse bg-muted rounded" />
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/**
 * Props for AsyncSelectQuery component
 */
export interface AsyncSelectQueryProps<T = string> {
  /**
   * Query key for React Query
   */
  queryKey: (string | number | boolean | undefined)[];

  /**
   * Query function that accepts search term and page param
   */
  queryFn: (
    search?: string,
    pageParam?: number
  ) => Promise<PaginatedResponse<AsyncSelectOption<T>>>;

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

  /**
   * Single select mode
   */
  multiple?: false;
  value?: T;
  onValueChange?: (value: T | undefined) => void;

  /**
   * Multi select mode
   */
  // multiple: true;
  // value?: T[];
  // onValueChange?: (value: T[]) => void;
}

/**
 * AsyncSelect component powered by React Query's useInfiniteQuery
 * 
 * This version leverages React Query's caching, background refetching,
 * and infinite query capabilities for better performance and UX.
 * 
 * @example
 * ```tsx
 * <AsyncSelectQuery
 *   queryKey={['users', searchTerm]}
 *   queryFn={async (search, page) => {
 *     const response = await fetch(`/api/users?search=${search}&page=${page}`);
 *     return response.json();
 *   }}
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 * />
 * ```
 */
export function AsyncSelectQuery<T = string>(props: AsyncSelectQueryProps<T>) {
  const {
    queryKey,
    queryFn,
    // pageSize = 20,
    searchDebounceMs = 300,
    placeholder = 'Select...',
    disabled = false,
    className,
    popoverClassName,
    width = '200px',
    searchable = true,
    searchPlaceholder = 'Search...',
    emptyMessage = 'No results found.',
    errorMessage,
    renderOption,
    renderSelected,
    renderMultiSelected,
    clearable = false,
    maxHeight = 300,
    loadMoreThreshold = 100,
    multiple = false,
    value,
    onValueChange,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, searchDebounceMs);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<string | number>(width);
  const commandListRef = React.useRef<React.ElementRef<typeof CommandList>>(null);

  // Build query key with search term
  const finalQueryKey = React.useMemo(
    () => [...queryKey, debouncedSearchTerm || ''],
    [queryKey, debouncedSearchTerm]
  );

  // Use infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: finalQueryKey,
    queryFn: ({ pageParam = 0 }) => {
      return queryFn(debouncedSearchTerm || undefined, pageParam);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
    enabled: open, // Only fetch when dropdown is open
  });

  // Flatten all pages into a single array
  const options = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // Set up infinite scroll
  const scrollContainerRef = useInfinitePagination(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    hasNextPage ?? false,
    isFetchingNextPage,
    loadMoreThreshold
  );

  // Attach ref to command list
  React.useEffect(() => {
    if (commandListRef.current) {
      scrollContainerRef.current = commandListRef.current as HTMLElement;
    }
  }, [scrollContainerRef]);

  // Sync popover width with trigger
  React.useEffect(() => {
    if (triggerRef.current && open) {
      const triggerWidth = triggerRef.current.offsetWidth;
      if (triggerWidth > 0) {
        setPopoverWidth(triggerWidth);
      }
    }
  }, [open, width]);

  // Find selected options
  const selectedOptions = React.useMemo(() => {
    if (multiple) {
      const values = (value as T[]) || [];
      return options.filter((opt) => values.includes(opt.id as T));
    } else {
      const selected = options.find((opt) => opt.id === value);
      return selected ? [selected] : [];
    }
  }, [options, value, multiple]);

  // Handle selection
  const handleSelect = React.useCallback(
    (optionId: string) => {
      if (multiple) {
        const currentValues = (value as T[]) || [];
        const optionValue = optionId as T;
        const isSelected = currentValues.includes(optionValue);

        let newValues: T[];
        if (isSelected) {
          newValues = currentValues.filter((v) => v !== optionValue);
        } else {
          newValues = [...currentValues, optionValue];
        }

        (onValueChange as (value: T[]) => void)?.(newValues);
      } else {
        const optionValue = optionId as T;
        const newValue = clearable && value === optionValue ? undefined : optionValue;
        (onValueChange as (value: T | undefined) => void)?.(newValue);
        setOpen(false);
      }
    },
    [multiple, value, onValueChange, clearable]
  );

  // Handle clear
  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiple) {
        (onValueChange as (value: T[]) => void)?.([]);
      } else {
        (onValueChange as (value: T | undefined) => void)?.(undefined);
      }
    },
    [multiple, onValueChange]
  );

  // Display value
  const displayValue = React.useMemo(() => {
    if (multiple) {
      if (selectedOptions.length === 0) {
        return null;
      }
      if (renderMultiSelected) {
        return renderMultiSelected(selectedOptions);
      }
      if (selectedOptions.length === 1) {
        return selectedOptions[0].label;
      }
      return `${selectedOptions.length} selected`;
    } else {
      const selected = selectedOptions[0];
      if (selected) {
        if (renderSelected) {
          return renderSelected(selected);
        }
        return selected.label;
      }
      return null;
    }
  }, [selectedOptions, multiple, renderSelected, renderMultiSelected]);

  // Final error message
  const finalError = errorMessage || (error instanceof Error ? error.message : null);
  const loading = isLoading || isFetching;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'w-full justify-between text-left min-w-0',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            maxWidth: '100%',
          }}
          disabled={disabled || loading}
        >
          <span className="truncate flex-1 text-left">
            {displayValue || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {clearable && (multiple ? (value as T[])?.length > 0 : value !== undefined) && (
              <button
                type="button"
                onClick={handleClear}
                className="opacity-50 hover:opacity-100 focus:outline-none"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0 w-auto max-w-[95vw] sm:max-w-none', popoverClassName)}
        align="start"
        style={{
          width:
            typeof popoverWidth === 'number'
              ? `${Math.min(popoverWidth, window.innerWidth * 0.95)}px`
              : popoverWidth,
          minWidth: typeof popoverWidth === 'number' ? `${popoverWidth}px` : popoverWidth,
        }}
      >
        <Command shouldFilter={false}>
          {searchable && (
            <div className="relative border-b">
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              {loading && options.length > 0 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          <CommandList
            ref={commandListRef}
            className={cn('overflow-y-auto overscroll-contain')}
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {finalError && (
              <div className="p-4 text-destructive text-center text-sm">
                {finalError}
              </div>
            )}
            {loading && options.length === 0 && <LoadingSkeleton />}
            {!loading && !finalError && options.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => {
                const optionId = String(option.id);
                const isSelected = multiple
                  ? (value as T[])?.includes(option.id as T)
                  : value === option.id;

                return (
                  <CommandItem
                    key={optionId}
                    value={optionId}
                    onSelect={() => handleSelect(optionId)}
                    disabled={option.disabled}
                    className={cn('cursor-pointer', isSelected && 'bg-accent')}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        {option.icon}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate">{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
              {isFetchingNextPage && (
                <CommandItem disabled>
                  <div className="flex items-center justify-center w-full py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading more...
                    </span>
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

AsyncSelectQuery.displayName = 'AsyncSelectQuery';
