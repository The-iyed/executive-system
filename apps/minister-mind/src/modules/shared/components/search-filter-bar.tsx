import React from 'react';
import { SearchInput } from './search-input';
import { Filter, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sanad-ai/ui';
import {
  MeetingStatus,
  MeetingStatusLabels,
  getMeetingStatusLabel,
} from '../types';

export interface SearchFilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: MeetingStatus | 'all';
  onStatusFilterChange?: (value: MeetingStatus | 'all') => void;
  onFilterClick?: () => void;
  onExportClick?: () => void;
  className?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'ادخل البحث',
  statusFilter,
  onStatusFilterChange,
  onFilterClick,
  onExportClick,
  className = '',
}) => {
  return (
    <div className={`flex flex-row items-center justify-between gap-4 w-full ${className}`} dir="rtl">
      {/* Right side - Search and Filters */}
      <div className="flex flex-row items-center gap-4">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          variant="default"
          className="w-[300px]"
        />
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) => onStatusFilterChange?.(value as MeetingStatus | 'all')}
        >
          <SelectTrigger className="w-[180px] border-gray-200 text-gray-600 text-sm font-medium">
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="all">جميع الحالات</SelectItem>
            {Object.values(MeetingStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {getMeetingStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={onFilterClick}
          className="
            flex items-center gap-2
            px-4 py-2
            border border-[#EAECF0]
            rounded-lg
            bg-white
            text-sm font-medium
            text-[#475467]
            hover:bg-gray-50
            transition-colors
          "
          style={{
            fontFamily: "'Ping AR + LT', sans-serif",
          }}
        >
          <Filter className="w-4 h-4" />
          فلتر البحث
        </button>
      </div>

      {/* Left side - Export */}
      <button
        onClick={onExportClick}
        className="
          flex items-center gap-2
          px-4 py-2
          border border-[#EAECF0]
          rounded-lg
          bg-white
          text-sm font-medium
          text-[#475467]
          hover:bg-gray-50
          transition-colors
        "
        style={{
          fontFamily: "'Ping AR + LT', sans-serif",
        }}
      >
        <Download className="w-4 h-4" />
        تصدير
      </button>
    </div>
  );
};

