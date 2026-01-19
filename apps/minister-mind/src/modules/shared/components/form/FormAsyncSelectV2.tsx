import React from 'react';
import AsyncSelectV2 from '../AsyncSelectV2';
import { cn } from '@sanad-ai/ui';

export interface FormAsyncSelectV2Props {
  value?: string | number | null;
  onValueChange?: (value: string | number | null) => void;
  placeholder?: string;
  loadOptions: (search: string, skip: number, limit: number) => Promise<{
    items: Array<{ value: string | number; label: string; [key: string]: any }>;
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
        'text-right h-[44px] bg-[#FFFFFF] border border-[#D0D5DD] rounded-[8px]',
        'focus:outline-none focus:border-[#008774]',
        error && 'border-[#D13C3C]',
        !error && 'focus:border-[#008774]',
        fullWidth && 'w-full',
        className
      )}
      fullWidth={fullWidth}
      searchPlaceholder={searchPlaceholder}
    />
  );
};

FormAsyncSelectV2.displayName = 'FormAsyncSelectV2';
