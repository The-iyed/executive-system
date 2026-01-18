import { AsyncSelectV2 } from '@sanad-ai/ui';
import { UseQueryResult } from '@tanstack/react-query';
import { cn } from '@sanad-ai/ui';
import { AsyncSelectOption } from '@/components/async-select-v2';

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
  // isLoading: externalIsLoading,
  errorMessage: externalError,
  selectedLabel,
  width = '100%',
  enablePagination = false,
  limit = 6,
}: FormAsyncSelectProps<T>) => {
  return (
    <AsyncSelectV2<T>
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      loadOptions={loadOptions}
      query={query}
      disabled={disabled}
      searchable={searchable}
      selectedLabel={selectedLabel}
      errorMessage={externalError}
      width={width}
      enablePagination={enablePagination}
      limit={limit}
      triggerClassName={cn(
        'text-right h-[44px] p-[10px_14px] bg-[#FFFFFF] border border-[#D0D5DD] box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)] rounded-[8px] font-style-normal font-weight-400 font-size-16 line-height-24 color-[#667085]',
        'flex-row-reverse',
        'justify-between',
        'focus:outline-none focus:border-[#008774]',
        error && 'border-[#D13C3C]',
        !error && 'focus:border-[#008774]',
        className
      )}
      searchPlaceholder="البحث..."
    />
  );
};
