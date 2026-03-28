import React from 'react';
import { Icon } from '@iconify/react';
import { Search } from 'lucide-react';

interface MeetingListHeaderProps {
  title: string;
  description?: string;
  headerIcon?: string;
  headerRight?: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filtersSlot?: React.ReactNode;
}

export const MeetingListHeader: React.FC<MeetingListHeaderProps> = ({
  title,
  description,
  headerIcon = 'solar:inbox-bold',
  headerRight,
  search,
  onSearchChange,
  searchPlaceholder = 'بحث...',
  filtersSlot,
}) => {
  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex flex-col gap-3">
      {/* Row 1: Title + Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary-50)' }}
          >
            <Icon
              icon={headerIcon}
              width={22}
              height={22}
              style={{ color: 'var(--color-primary-500)' }}
            />
          </div>
          <div>
            <h1
              className="text-lg sm:text-xl font-bold"
              style={{ color: 'var(--color-text-gray-900)' }}
            >
              {title}
            </h1>
            {description && (
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-gray-500)' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Search + Filter button + headerRight */}
        <div className="flex items-center gap-2 flex-wrap">
          {headerRight}
          {filtersSlot}
          <div className="relative">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--color-text-gray-500)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 pr-10 pl-4 rounded-xl bg-white border text-sm transition-all w-[180px] sm:w-[220px] focus:outline-none focus:ring-1"
              style={{
                borderColor: 'var(--color-base-gray-200)',
                color: 'var(--color-text-gray-700)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
