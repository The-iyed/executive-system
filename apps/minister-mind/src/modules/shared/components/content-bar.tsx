import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ActionButton } from './welcome-section';
import { Tabs } from './tabs';

export interface ContentBarFilterTab {
  id: string;
  label: string;
}

export interface ContentBarProps {
  primaryAction?: ActionButton;
  filterTabs?: ContentBarFilterTab[];
  activeFilterId?: string;
  onFilterChange?: (id: string) => void;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

export const ContentBar: React.FC<ContentBarProps> = ({
  primaryAction,
  filterTabs = [],
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
      className={`flex flex-row items-center justify-between border border-[#F2F2F2] gap-6 px-4 py-2 rounded-[30px] min-h-[56px] ${className} bg-transparent!`}
      dir="rtl"
    >
      <span>

     {primaryAction && (
        <button
          type="button"
          onClick={primaryAction?.onClick}
          className="flex items-center gap-3 py-2 px-4 rounded-full text-white font-bold text-base whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#00A79D' }}
          >
          <Icon icon="solar:add-circle-outline" width={22} height={22} className="flex-shrink-0" />
          <span>{primaryAction?.label ?? 'إنشاء اجتماع'}</span>
        </button>
       )}
      </span>
      <span>
      {filterTabs.length > 0 && (
        <Tabs
          items={filterTabs}
          activeTab={currentFilter}
          onTabChange={handleFilterClick}
          variant="pill"
        />
      )}
      </span>
    </div>
  );
};