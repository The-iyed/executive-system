import React, { useMemo } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent, cn } from '@/lib/ui';
import type { MeetingFilterConfig } from '../types';

const MAX_VISIBLE_CHIPS = 3;

interface MeetingListFiltersProps {
  filtersConfig: MeetingFilterConfig[];
  filters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  onReset: () => void;
}

export const MeetingListFilters: React.FC<MeetingListFiltersProps> = ({
  filtersConfig,
  filters,
  onFilterChange,
  onReset,
}) => {
  const activeCount = Object.values(filters).reduce((sum, v) => sum + v.length, 0);

  const allChips = useMemo(() => {
    const chips: { key: string; value: string; label: string }[] = [];
    filtersConfig.forEach((config) => {
      (filters[config.key] ?? []).forEach((val) => {
        const opt = config.options.find((o) => o.value === val);
        chips.push({ key: config.key, value: val, label: opt?.label ?? val });
      });
    });
    return chips;
  }, [filtersConfig, filters]);

  const visibleChips = allChips.slice(0, MAX_VISIBLE_CHIPS);
  const overflowCount = allChips.length - MAX_VISIBLE_CHIPS;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-row-reverse">
      {/* Filter trigger button */}
      {filtersConfig.map((config) => {
        const selected = filters[config.key] ?? [];

        return (
          <Popover key={config.key}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'h-9 px-3.5 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap shrink-0',
                  selected.length > 0
                    ? 'border-[var(--color-primary-300)] text-[var(--color-primary-700)] bg-[var(--color-primary-50)]'
                    : 'bg-white border-[var(--color-base-gray-200)] text-[var(--color-text-gray-600)] hover:border-[var(--color-base-gray-300)]'
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {config.label}
                  {selected.length > 0 && (
                    <span
                      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold mr-1.5 text-white"
                      style={{ background: 'var(--color-primary-500)' }}
                    >
                      {selected.length}
                    </span>
                  )}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={6}
              className="w-56 p-1.5 rounded-xl shadow-lg border border-[var(--color-base-gray-200)] bg-white"
              dir="rtl"
            >
              <div className="flex flex-col gap-0.5 max-h-[260px] overflow-y-auto">
                {config.options.map((opt) => {
                  const isChecked = selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const next = isChecked
                          ? selected.filter((v) => v !== opt.value)
                          : [...selected, opt.value];
                        onFilterChange(config.key, next);
                      }}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-right',
                        isChecked
                          ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                          : 'text-[var(--color-text-gray-600)] hover:bg-[var(--color-base-gray-50)]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all',
                          isChecked
                            ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]'
                            : 'border-[var(--color-base-gray-300)] bg-white'
                        )}
                      >
                        {isChecked && (
                          <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-[13px]">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {selected.length > 0 && (
                <div className="border-t border-[var(--color-base-gray-100)] mt-1 pt-1">
                  <button
                    onClick={() => onFilterChange(config.key, [])}
                    className="w-full text-xs py-1.5 rounded-lg transition-colors text-center text-[var(--color-text-gray-400)] hover:text-[var(--color-text-gray-600)] hover:bg-[var(--color-base-gray-50)]"
                  >
                    مسح الكل
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        );
      })}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <>
          <div className="w-px h-5 bg-[var(--color-base-gray-200)] shrink-0" />

          {visibleChips.map((chip) => (
            <span
              key={`${chip.key}-${chip.value}`}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium shrink-0 bg-[var(--color-base-gray-100)] text-[var(--color-text-gray-700)] border border-[var(--color-base-gray-200)]"
            >
              {chip.label}
              <X
                className="w-3 h-3 cursor-pointer text-[var(--color-text-gray-400)] hover:text-[var(--color-text-gray-700)] transition-colors"
                onClick={() =>
                  onFilterChange(
                    chip.key,
                    (filters[chip.key] ?? []).filter((v) => v !== chip.value)
                  )
                }
              />
            </span>
          ))}

          {overflowCount > 0 && (
            <span className="inline-flex items-center h-7 px-2 rounded-md text-xs font-semibold shrink-0 bg-[var(--color-base-gray-100)] text-[var(--color-text-gray-500)]">
              +{overflowCount}
            </span>
          )}

          <button
            onClick={onReset}
            className="text-xs px-2 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 text-[var(--color-text-gray-400)] hover:text-[var(--color-text-gray-600)] hover:bg-[var(--color-base-gray-50)]"
          >
            مسح الكل
          </button>
        </>
      )}
    </div>
  );
};
