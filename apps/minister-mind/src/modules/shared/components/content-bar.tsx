import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ActionButton } from './welcome-section';

const TEAL = '#00A79D';
const BAR_BG = '#E5E7EB';
const PILL_BG = '#F0F0F0';

export interface ContentBarFilterTab {
  id: string;
  label: string;
}

const DEFAULT_FILTERS: ContentBarFilterTab[] = [
  { id: 'draft', label: 'مسودة' },
  { id: 'under_review', label: 'قيد المراجعة' },
  { id: 'rescheduled', label: 'معاد من الجدولة' },
  { id: 'content_returned', label: 'معاد من المحتوى' },
];

export interface ContentBarProps {
  title: string;
  primaryAction?: ActionButton;
  filterTabs?: ContentBarFilterTab[];
  activeFilterId?: string;
  onFilterChange?: (id: string) => void;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

export const ContentBar: React.FC<ContentBarProps> = ({
  title,
  primaryAction,
  filterTabs = DEFAULT_FILTERS,
  activeFilterId,
  onFilterChange,
  className = '',
}) => {
  const [activeFilter, setActiveFilter] = useState(activeFilterId ?? filterTabs[0]?.id ?? 'draft');
  const currentFilter = activeFilterId ?? activeFilter;

  const handleFilterClick = (id: string) => {
    setActiveFilter(id);
    onFilterChange?.(id);
  };

  return (
    <div
      className={`flex flex-row items-center border border-[#F2F2F2] justify-between gap-6 px-4 py-2 rounded-[30px] min-h-[56px] ${className} bg-transparent!`}
      style={{
        fontFamily: "'Almarai', sans-serif",
      }}
      dir="rtl"
    >
      {/* Right: Single teal pill = title + plus + "إنشاء اجتماع" (like image) */}
      <div className="flex flex-row items-center flex-shrink-0 gap-2">
        <span>{title}</span>
        <button
          type="button"
          onClick={primaryAction?.onClick}
          className="flex items-center gap-3 py-2 px-4 rounded-full text-white font-bold text-base whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ backgroundColor: TEAL }}
        >
          <Icon icon="solar:add-circle-outline" width={22} height={22} className="flex-shrink-0" />
          <span>{primaryAction?.label ?? 'إنشاء اجتماع'}</span>
        </button>
      </div>

      {/* Left/Center: Filter pill - hide when no tabs (page has its own filters) */}
      {filterTabs.length > 0 && (
      <div
        className="flex flex-row items-center gap-0 rounded-full overflow-hidden flex-shrink-0"
        style={{ backgroundColor: 'white', padding: '5px' }}
      >
        {filterTabs.map((tab) => {
          const isActive = currentFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterClick(tab.id)}
              className="flex items-center justify-center py-2.5 px-5 rounded-full transition-colors min-w-[110px]"
              style={{
                backgroundColor: isActive ? TEAL : 'transparent',
                color: isActive ? '#fff' : '#374151',
              }}
            >
              <span className="text-sm font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
};
