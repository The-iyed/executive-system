import React from 'react';
import { SearchInput } from './search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sanad-ai/ui';
import {
  MeetingStatus,
  getMeetingStatusLabel,
} from '../types';

export interface SearchFilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: MeetingStatus | 'all';
  onStatusFilterChange?: (value: MeetingStatus | 'all') => void;
  className?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'ادخل البحث',
  statusFilter,
  onStatusFilterChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-row items-center gap-3 ${className}`} dir="rtl">
      {/* Status Filter Select - right in RTL */}
      <Select
        value={statusFilter || 'all'}
        onValueChange={(value) => onStatusFilterChange?.(value as MeetingStatus | 'all')}
      >
        <SelectTrigger
          className="w-[130px] h-10 bg-white border border-gray-200/80 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.06)] text-sm font-medium text-gray-700 px-4"
          style={{ fontFamily: "'Almarai', sans-serif" }}
        >
          <SelectValue placeholder="جميع الحالات" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          <SelectItem value="all">جميع الحالات</SelectItem>
          {Object.values(MeetingStatus)
            .filter((status) =>
              status !== MeetingStatus.RETURNED_FROM_SCHEDULING_MANAGER &&
              status !== MeetingStatus.RETURNED_FROM_CONTENT_MANAGER
            )
            .map((status) => (
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

