import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ActionButton } from './welcome-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sanad-ai/ui';
import { ViewSwitcher, type ViewType } from './view-switcher';
import { SearchInput } from './search-input';

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
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showViewSwitcher?: boolean;
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
  className?: string;
}

export const ContentBar: React.FC<ContentBarProps> = ({
  primaryAction,
  filterTabs = [],
  showViewSwitcher = false,
  activeFilterId,
  onFilterChange,
  searchPlaceholder = 'بحث',
  searchValue: controlledSearchValue,
  onSearchChange,
  view: controlledView,
  onViewChange,
  className = '',
}) => {
  const [activeFilter, setActiveFilter] = useState(activeFilterId ?? filterTabs[0]?.id ?? 'draft');
  const [internalView, setInternalView] = useState<ViewType>('table');
  const [internalSearchValue, setInternalSearchValue] = useState('');

  const currentFilter = activeFilterId ?? activeFilter;
  const view = controlledView ?? internalView;
  const setView = (v: ViewType) => {
    if (controlledView === undefined) setInternalView(v);
    onViewChange?.(v);
  };
  const searchValue = controlledSearchValue ?? internalSearchValue;
  const setSearchValue = (v: string) => {
    if (controlledSearchValue === undefined) setInternalSearchValue(v);
    onSearchChange?.(v);
  };

  const handleFilterClick = (id: string) => {
    setActiveFilter(id);
    onFilterChange?.(id);
  };

  return (
    <div
      className={`flex flex-row items-center justify-between gap-6 px-4 py-2 rounded-[30px] min-h-[56px] bg-transparent! ${className}`}
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
      <span className="flex flex-row items-center gap-4">
        {filterTabs.length > 0 && (
          <Select value={currentFilter} onValueChange={handleFilterClick}>
            <SelectTrigger
              className="min-w-[180px] w-[200px] h-10 bg-white border border-gray-200/80 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.06)] text-sm font-medium text-gray-700 px-4"
            >
              <SelectValue placeholder={filterTabs[0]?.label} />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {filterTabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
       {showViewSwitcher && (
        <>
          <div className="w-px h-8 bg-gray-300 flex-shrink-0" aria-hidden />
        <ViewSwitcher view={view} onViewChange={setView} />
        <div className="w-px h-8 bg-gray-300 flex-shrink-0" aria-hidden />
        <SearchInput
          value={searchValue}
          onChange={setSearchValue}
          placeholder={searchPlaceholder}
          variant="default"
          className="w-[280px] min-w-0 rounded-full bg-white border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        />
        </>
       )}
      </span>
    </div>
  );
};