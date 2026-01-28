import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { AsyncPaginate, LoadOptions } from 'react-select-async-paginate';
import { GroupBase, SingleValue, ActionMeta, OptionsOrGroups } from 'react-select';
import { cn } from '@sanad-ai/ui';
import type { SelectOption, PaginatedResponse, AdditionalOptions, AsyncSelectV2Props, OptionType } from './types';

const AsyncSelectV2: React.FC<AsyncSelectV2Props> = ({
  value,
  onChange,
  placeholder = 'Select item',
  loadOptions,
  isLoading = false,
  isDisabled = false,
  isClearable = true,
  isSearchable = true,
  debounceTimeout = 500,
  limit = 10,
  error = false,
  errorMessage,
  emptyMessage = 'No options found',
  className,
  fullWidth = false,
}) => {
  const currentPageRef = useRef(1);
  const currentSearchRef = useRef('');
  const previousSearchRef = useRef('');
  const isLoadingRef = useRef(false);
  const optionsCacheRef = useRef<SelectOption[]>([]);
  const hasMoreRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const pendingPromisesRef = useRef<Map<string, {
    resolve: (value: { options: SelectOption[]; hasMore: boolean; additional: AdditionalOptions }) => void;
    page: number;
    search: string;
  }>>(new Map());

  // Load options function for AsyncPaginate
  const loadOptionsHandler: LoadOptions<SelectOption, GroupBase<SelectOption>, AdditionalOptions> = useCallback(
    async (
      searchInput: string,
      _loadedOptions: OptionsOrGroups<SelectOption, GroupBase<SelectOption>>,
      additional?: AdditionalOptions
    ): Promise<{
      options: SelectOption[];
      hasMore: boolean;
      additional: AdditionalOptions;
    }> => {
      // Determine page number from additional (provided by AsyncPaginate on scroll)
      // Calculate skip from page (page 1 = skip 0, page 2 = skip limit, etc.)
      const page = additional?.page || 1;
      const skip = (page - 1) * limit;

      // Check if this is a search change
      const isSearchChange = searchInput !== currentSearchRef.current;

      // Reset page to 1 on search change
      const actualPage = isSearchChange ? 1 : page;
      const actualSkip = isSearchChange ? 0 : skip;

      // Update refs
      currentPageRef.current = actualPage;
      currentSearchRef.current = searchInput;

      // Update previous search after setting current
      if (isSearchChange) {
        previousSearchRef.current = searchInput;
        optionsCacheRef.current = []; // Clear cache on search change
        hasMoreRef.current = true; // Reset hasMore on search change
      }

      // Check if we should skip fetch (already loading same request)
      const promiseKey = `${actualPage}-${searchInput}`;
      if (pendingPromisesRef.current.has(promiseKey)) {
        // Already fetching this page, return empty to prevent duplicate
        return Promise.resolve({
          options: [],
          hasMore: hasMoreRef.current,
          additional: {
            page: actualPage,
          },
        });
      }

      // Prevent duplicate initial load (when defaultOptions triggers multiple times)
      if (actualPage === 1 && searchInput === '' && initialLoadDoneRef.current) {
        // Initial load already done, return cached options
        if (optionsCacheRef.current.length > 0) {
          return Promise.resolve({
            options: optionsCacheRef.current,
            hasMore: hasMoreRef.current,
            additional: {
              page: 2,
            },
          });
        }
      }

      // For pagination (page > 1), check if we already have all data
      if (actualPage > 1 && !hasMoreRef.current) {
        // No more data to load
        return Promise.resolve({
          options: [],
          hasMore: false,
          additional: {
            page: actualPage,
          },
        });
      }

      // Create promise that will be resolved when data arrives
      return new Promise((resolve) => {
        // Store promise resolver
        pendingPromisesRef.current.set(promiseKey, {
          resolve,
          page: actualPage,
          search: searchInput,
        });

        // Trigger fetch
        isLoadingRef.current = true;
        
        loadOptions(searchInput, actualSkip, limit)
          .then((response: PaginatedResponse<SelectOption>) => {
            const stored = pendingPromisesRef.current.get(promiseKey);
            if (!stored) {
              // Promise was cancelled
              return;
            }

            const isSearchChangeNow = searchInput !== previousSearchRef.current;
            let optionsToReturn: SelectOption[] = [];

            if (actualPage === 1 || isSearchChangeNow) {
              // Reset cache on first page or search change
              optionsCacheRef.current = response.items;
              previousSearchRef.current = searchInput;
              optionsToReturn = response.items; // Return all options for page 1
            } else {
              // For pagination, only return NEW options (not already in cache)
              const existingValues = new Set(optionsCacheRef.current.map(o => o.value));
              const newUniqueOptions = response.items.filter(o => !existingValues.has(o.value));

              // Update cache with new options
              if (newUniqueOptions.length > 0) {
                optionsCacheRef.current = [...optionsCacheRef.current, ...newUniqueOptions];
                optionsToReturn = newUniqueOptions; // Return only new options for pagination
              } else {
                optionsToReturn = []; // No new options
              }
            }

            // Update hasMore from response
            hasMoreRef.current = response.has_next || false;

            // Mark initial load as done
            if (actualPage === 1 && searchInput === '') {
              initialLoadDoneRef.current = true;
            }

            // Resolve promise
            stored.resolve({
              options: optionsToReturn,
              hasMore: hasMoreRef.current,
              additional: {
                page: actualPage + 1,
              },
            });

            pendingPromisesRef.current.delete(promiseKey);
            isLoadingRef.current = false;
          })
          .catch((error) => {
            const stored = pendingPromisesRef.current.get(promiseKey);
            if (stored) {
              stored.resolve({
                options: [],
                hasMore: false,
                additional: {
                  page: actualPage,
                },
              });
              pendingPromisesRef.current.delete(promiseKey);
              isLoadingRef.current = false;
            }
            console.error('Error loading options:', error);
          });

        // Timeout fallback (in case data never arrives)
        const timeoutId = setTimeout(() => {
          if (pendingPromisesRef.current.has(promiseKey)) {
            pendingPromisesRef.current.delete(promiseKey);
            isLoadingRef.current = false;
            resolve({
              options: [],
              hasMore: false,
              additional: {
                page: actualPage,
              },
            });
          }
        }, 10000); // 10 second timeout

        // Clean up timeout if promise is resolved elsewhere
        const originalResolve = resolve;
        resolve = (value) => {
          clearTimeout(timeoutId);
          originalResolve(value);
        };

        // Update the stored resolve function
        const stored = pendingPromisesRef.current.get(promiseKey);
        if (stored) {
          stored.resolve = resolve;
        }
      });
    },
    [loadOptions, limit]
  );

  // Update loading ref when fetch state changes
  useEffect(() => {
    isLoadingRef.current = isLoading;
    if (!isLoading) {
      // Reset when fetch completes
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  }, [isLoading]);

  // Handle value change
  const handleChange = useCallback((
    newValue: SingleValue<SelectOption>,
    actionMeta: ActionMeta<SelectOption>
  ) => {
    if (!onChange) return;

    if (!newValue || !('value' in newValue)) {
      onChange(null, actionMeta);
      return;
    }

    // Return as OptionType object
    const optionValue: OptionType = {
      value: newValue.value,
      label: newValue.label,
      description: newValue.description,
    };
    onChange(optionValue, actionMeta);
  }, [onChange]);

  // Convert value to option
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined) {
      return null;
    }

    // Value is now an OptionType object, try to find in cache first
    const cachedOption = optionsCacheRef.current.find(opt => opt.value === value.value);
    if (cachedOption) {
      return cachedOption;
    }

    // If not in cache, use the provided value object directly
    return value as SelectOption;
  }, [value]);

  return (
    <div className={cn('async-select-v2-wrapper', fullWidth && 'w-full')}>
      <div className={cn('async-select-v2-container', error && 'has-error', className)}>
        <AsyncPaginate
          value={selectedOption}
          onChange={handleChange}
          loadOptions={loadOptionsHandler}
          placeholder={placeholder}
          isDisabled={isDisabled}
          isClearable={isClearable}
          isSearchable={isSearchable}
          isLoading={isLoading}
          debounceTimeout={debounceTimeout}
          defaultOptions={true}
          additional={{
            page: 1,
          }}
          formatOptionLabel={(option, { context }) => {
            if (context === 'value') {
              return option.label;
            }
            return (
              <div className="flex flex-col">
                <div className="text-inherit font-normal text-sm">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-base-gray-500 text-xs">
                    {option.description}
                  </div>
                )}
              </div>
            );
          }}
          classNamePrefix="async-select-v2"
          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          noOptionsMessage={() => {
            if (isLoading) return 'Loading...';
            if (errorMessage) return errorMessage;
            return emptyMessage;
          }}
          styles={{
            control: (base, state) => ({
              ...base,
              textAlign: 'right',
              direction: 'rtl',
              minHeight: '44px',
              cursor: 'pointer',
              borderRadius: '8px',
              borderColor: error ? '#D13C3C' : state.isFocused ? '#008774' : '#D0D5DD',
              boxShadow: state.isFocused ? '0 0 0 1px #008774' : 'none',
              '&:hover': {
                borderColor: error ? '#D13C3C' : state.isFocused ? '#008774' : '#D0D5DD',
              },
            }),
            placeholder: (base) => ({
              ...base,
              textAlign: 'right',
              color: '#667085',
            }),
            input: (base) => ({
              ...base,
              textAlign: 'right',
              color: '#101828',
            }),
            menu: (base) => ({
              ...base,
              textAlign: 'right',
              direction: 'rtl',
              zIndex: 9999,
              backgroundColor: '#FFFFFF',
            }),
            menuPortal: (base) => ({
              ...base,
              zIndex: 9999,
            }),
            option: (base, state) => ({
              ...base,
              textAlign: 'right',
              color: state.isSelected ? '#FFFFFF' : '#101828',
              backgroundColor: state.isSelected
                ? '#008774'
                : state.isFocused
                ? '#f0f9ff'
                : 'transparent',
              cursor: 'pointer',
              '&:active': {
                backgroundColor: '#008774',
                color: '#FFFFFF',
              },
              '&:hover': {
                backgroundColor: state.isSelected ? '#008774' : '#f0f9ff',
                color: state.isSelected ? '#FFFFFF' : '#101828',
              },
            }),
            singleValue: (base) => ({
              ...base,
              color: '#101828',
            }),
            multiValue: (base) => ({
              ...base,
              color: '#101828',
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: '#101828',
            }),
          }}
        />
      </div>
    </div>
  );
};

export default AsyncSelectV2;