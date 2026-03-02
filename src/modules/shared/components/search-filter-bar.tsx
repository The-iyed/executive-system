import React from 'react';
import { SearchInput } from './search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui';
import { MeetingStatus } from '../types';
import { getMeetingStatusLabel } from '../utils';

export interface SearchFilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: MeetingStatus | 'all';
  onStatusFilterChange?: (value: MeetingStatus | 'all') => void;
  /** When true, hide "جميع الحالات" and only show status options (e.g. default to draft elsewhere) */
  hideAllOption?: boolean;
  /** When provided, only these statuses are shown in the filter. Otherwise all MeetingStatus values are shown. */
  statusOptions?: MeetingStatus[];
  className?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'ادخل البحث',
  statusFilter,
  onStatusFilterChange,
  hideAllOption = false,
  statusOptions,
  className = '',
}) => {
  const selectValue = hideAllOption ? (statusFilter ?? MeetingStatus.DRAFT) : (statusFilter || 'all');
  const options = statusOptions ?? Object.values(MeetingStatus);

  return (
    <div className={`flex flex-row items-center gap-3 ${className}`} dir="rtl">
      {/* Status Filter Select - right in RTL */}
      <Select
        value={selectValue}
        onValueChange={(value) => onStatusFilterChange?.(value as MeetingStatus | 'all')}
      >
        <SelectTrigger
          className="min-w-[180px] w-[200px] h-10 bg-white border border-gray-200/80 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.06)] text-sm font-medium text-gray-700 px-4"
        >
          <SelectValue placeholder={hideAllOption ? undefined : 'جميع الحالات'} />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {!hideAllOption && <SelectItem value="all">جميع الحالات</SelectItem>}
          {options.map((status) => (
              <SelectItem key={status} value={status}>
                {getMeetingStatusLabel(status)}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Search Input - themed pill */}
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        variant="default"
        className="w-[220px] min-w-0 rounded-full bg-white border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      />
    </div>
  );
};

