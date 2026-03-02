import React from 'react';
import { AsyncSelect, cn } from '@/lib/ui';
import type { AsyncSelectOption } from '@/lib/ui';
import { UseQueryResult } from '@tanstack/react-query';

export interface FormAsyncSelectProps<T = string> {
  value?: T;
  onValueChange?: (value: T) => void;
  placeholder?: string;
  loadOptions?: (search?: string, skip?: number, limit?: number) => Promise<AsyncSelectOption<T>[] | any>;
  query?: UseQueryResult<AsyncSelectOption<T>[], Error>;
  error?: boolean;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  selectedLabel?: string;
  width?: string | number;
  enablePagination?: boolean;
  limit?: number;
  fullWidth?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  clearable?: boolean;
  renderOption?: (option: AsyncSelectOption<T>) => React.ReactNode;
  renderSelected?: (option: AsyncSelectOption<T> | null) => React.ReactNode;
}

export const FormAsyncSelect = <T extends string = string>({
  value,
  onValueChange,
  placeholder = '-------',
  loadOptions,
  query,
  error,
  className,
  disabled,
  searchable = true,
  errorMessage: externalError,
  selectedLabel,
  width = '100%',
  enablePagination = false,
  limit = 6,
  fullWidth = false,
  searchPlaceholder = 'البحث...',
  emptyMessage,
  clearable,
  renderOption,
  renderSelected,
}: FormAsyncSelectProps<T>) => {
  return (
    <AsyncSelect<T>
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      loadOptions={loadOptions}
      query={query}
      disabled={disabled}
      searchable={searchable}
      selectedLabel={selectedLabel}
      errorMessage={externalError}
      width={fullWidth ? '100%' : width}
      enablePagination={enablePagination}
      limit={limit}
      clearable={clearable}
      renderOption={renderOption}
      renderSelected={renderSelected}
      triggerClassName={cn(
        'text-right h-[44px] p-[10px_14px] bg-[#FFFFFF] border border-[#D0D5DD] box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)] rounded-[8px] font-style-normal font-weight-400 font-size-16 line-height-24 color-[#667085]',
        'flex-row-reverse',
        'justify-between',
        'focus:outline-none focus:border-[#008774]',
        error && 'border-[#D13C3C]',
        !error && 'focus:border-[#008774]',
        fullWidth && 'w-full',
        className
      )}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
    />
  );
};

FormAsyncSelect.displayName = 'FormAsyncSelect';
