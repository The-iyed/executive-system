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
    <div className={`flex flex-row items-center gap-2 ${className}`} dir="rtl">
      {/* Status Filter Select - Now first (on the right in RTL) */}
      <Select
        value={statusFilter || 'all'}
        onValueChange={(value) => onStatusFilterChange?.(value as MeetingStatus | 'all')}
      >
        <SelectTrigger 
          className="
            w-[120px] h-[32px]
            bg-white
            border border-[#D0D5DD]
            rounded-lg
            shadow-[0px_1px_2px_rgba(16,24,40,0.05)]
            text-sm font-medium
            text-[#344054]
            px-3 py-1.5
          "
          style={{
            fontFamily: "'Ping AR + LT', sans-serif",
          }}
        >
          <SelectValue placeholder="جميع الحالات" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          <SelectItem value="all">جميع الحالات</SelectItem>
          {Object.values(MeetingStatus)
            .filter((status) => 
              // Exclude legacy returned statuses to avoid duplicates
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

      {/* Search Input - Now second (on the left in RTL) */}
      <div className="w-[240px] h-[32px]">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          variant="default"
          className="w-full h-[32px]"
        />
      </div>
    </div>
  );
};

