import React from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent, cn } from '@/lib/ui';
import type { MeetingFilterConfig } from '../types';

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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filtersConfig.map((config) => {
        const selected = filters[config.key] ?? [];

        return (
          <Popover key={config.key}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'h-9 px-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all',
                  selected.length > 0
                    ? 'border-[var(--color-primary-200)] text-[var(--color-primary-700)]'
                    : 'bg-white border-[var(--color-base-gray-200)] text-[var(--color-text-gray-600)] hover:border-[var(--color-base-gray-300)]'
                )}
                style={selected.length > 0 ? { background: 'var(--color-primary-50)' } : {}}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{selected.length > 0 ? `${config.label} (${selected.length})` : config.label}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2" dir="rtl">
              <div className="flex flex-col gap-0.5 max-h-[280px] overflow-y-auto">
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
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-right',
                        isChecked
                          ? 'text-[var(--color-primary-700)]'
                          : 'text-[var(--color-text-gray-600)] hover:bg-[var(--color-base-gray-50)]'
                      )}
                      style={isChecked ? { background: 'var(--color-primary-50)' } : {}}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          isChecked
                            ? 'border-[var(--color-primary-500)]'
                            : 'border-[var(--color-base-gray-300)]'
                        )}
                        style={isChecked ? { background: 'var(--color-primary-500)' } : {}}
                      >
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {selected.length > 0 && (
                <button
                  onClick={() => onFilterChange(config.key, [])}
                  className="w-full mt-2 pt-2 border-t text-xs transition-colors text-center py-1.5"
                  style={{
                    borderColor: 'var(--color-base-gray-100)',
                    color: 'var(--color-text-gray-500)',
                  }}
                >
                  مسح الكل
                </button>
              )}
            </PopoverContent>
          </Popover>
        );
      })}

      {/* Active chips */}
      {activeCount > 0 && (
        <>
          {filtersConfig.map((config) =>
            (filters[config.key] ?? []).map((val) => {
              const opt = config.options.find((o) => o.value === val);
              return (
                <span
                  key={`${config.key}-${val}`}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-700)',
                  }}
                >
                  {opt?.label ?? val}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() =>
                      onFilterChange(
                        config.key,
                        (filters[config.key] ?? []).filter((v) => v !== val)
                      )
                    }
                  />
                </span>
              );
            })
          )}
          <button
            onClick={onReset}
            className="text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-gray-500)' }}
          >
            مسح الكل
          </button>
        </>
      )}
    </div>
  );
};
