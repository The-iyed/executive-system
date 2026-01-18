import * as React from 'react';
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
import type { AsyncSelectProps } from './types';
import { useAsyncSelect } from './hooks/useAsyncSelect';
import { useInfinitePagination } from './hooks/useInfinitePagination';

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
 * Reusable AsyncSelect component with pagination, infinite scroll, and search
 * 
 * Supports both single and multi-select modes
 * 
 * @example
 * ```tsx
 * <AsyncSelect
 *   fetchOptions={async (search, page, pageSize) => {
 *     const response = await fetch(`/api/options?search=${search}&page=${page}&pageSize=${pageSize}`);
 *     return response.json();
 *   }}
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 *   placeholder="Select an option..."
 * />
 * ```
 */
export function AsyncSelect<T = string>(props: AsyncSelectProps<T>) {
  const {
    fetchOptions,
    pageSize = 20,
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
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<string | number>(width);
  const commandListRef = React.useRef<React.ElementRef<typeof CommandList>>(null);

  // Use async select hook
  const { state, actions } = useAsyncSelect(
    fetchOptions,
    pageSize,
    searchDebounceMs,
    open
  );

  // Set up infinite scroll
  const scrollContainerRef = useInfinitePagination(
    actions.loadMore,
    state.hasMore,
    state.loading,
    loadMoreThreshold
  );

  // Attach ref to command list and update when dropdown opens or options change
  React.useEffect(() => {
    if (open && commandListRef.current) {
      scrollContainerRef.current = commandListRef.current as HTMLElement;
    }
  }, [open, scrollContainerRef, state.options.length]);

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
      return state.options.filter((opt) => values.includes(opt.id as T));
    } else {
      const selected = state.options.find((opt) => opt.id === value);
      return selected ? [selected] : [];
    }
  }, [state.options, value, multiple]);

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
      // If we have a value but no selected option (not loaded yet), try renderSelected with null
      if (value !== undefined && renderSelected) {
        const fallbackValue = renderSelected(null);
        if (fallbackValue) {
          return fallbackValue;
        }
      }
      return null;
    }
  }, [selectedOptions, multiple, renderSelected, renderMultiSelected, value]);

  // Final error message
  const finalError = errorMessage || state.error;

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
            'w-full justify-between min-w-0',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            maxWidth: '100%',
          }}
          disabled={disabled || state.loading}
        >
          <span className="truncate flex-1">
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
                value={state.searchTerm}
                onValueChange={actions.setSearchTerm}
              />
              {state.loading && state.options.length > 0 && (
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
            {state.loading && state.options.length === 0 && <LoadingSkeleton />}
            {!state.loading && !finalError && state.options.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup>
              {state.options.map((option) => {
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
                    className={cn(
                      'cursor-pointer',
                      isSelected && 'bg-accent'
                    )}
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
              {state.loading && state.options.length > 0 && (
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

AsyncSelect.displayName = 'AsyncSelect';
