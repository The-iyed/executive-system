import React from 'react';
import AsyncSelectV2 from '../AsyncSelectV2';
import { cn } from '@sanad-ai/ui';
import type { OptionType } from '../AsyncSelectV2/types';

export interface FormAsyncSelectV2Props {
  value?: OptionType | null;
  onValueChange?: (value: OptionType | null) => void;
  placeholder?: string;
  loadOptions: (search: string, skip: number, limit: number) => Promise<{
    items: Array<OptionType & { [key: string]: any }>;
    total: number;
    skip: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  }>;
  isLoading?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  debounceTimeout?: number;
  limit?: number;
  error?: boolean;
  errorMessage?: string | null;
  emptyMessage?: string;
  className?: string;
  fullWidth?: boolean;
  searchPlaceholder?: string;
  menuPortalTarget?: HTMLElement | null;
  /** When false, options load only after user types (e.g. search API with required q). Default true. */
  defaultOptions?: boolean;
  /** Called when the menu opens (first click). Use to mark touched and show errors. */
  onFocus?: () => void;
  /** Called when the search input value changes (e.g. to use as name when selecting "manual entry"). */
  onInputChange?: (newValue: string) => void;
}

export const FormAsyncSelectV2: React.FC<FormAsyncSelectV2Props> = ({
  value,
  onValueChange,
  placeholder = 'اختر...',
  loadOptions,
  isLoading = false,
  isDisabled = false,
  isClearable = true,
  isSearchable = true,
  debounceTimeout = 500,
  limit = 10,
  error = false,
  errorMessage,
  emptyMessage = 'لم يتم العثور على نتائج',
  className,
  fullWidth = false,
  searchPlaceholder = 'ابحث...',
  menuPortalTarget,
  defaultOptions = true,
  onFocus,
  onInputChange,
}) => {
  return (
    <AsyncSelectV2
      value={value}
      onChange={onValueChange}
      placeholder={placeholder}
      loadOptions={loadOptions}
      isLoading={isLoading}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isSearchable={isSearchable}
      debounceTimeout={debounceTimeout}
      limit={limit}
      error={error}
      errorMessage={errorMessage}
      emptyMessage={emptyMessage}
      className={cn(
        error && 'border-[#D13C3C]',
        fullWidth && 'w-full',
        className
      )}
      fullWidth={fullWidth}
      searchPlaceholder={searchPlaceholder}
      menuPortalTarget={menuPortalTarget}
      defaultOptions={defaultOptions}
      onFocus={onFocus}
      onInputChange={onInputChange}
    />
  );
};

FormAsyncSelectV2.displayName = 'FormAsyncSelectV2';
