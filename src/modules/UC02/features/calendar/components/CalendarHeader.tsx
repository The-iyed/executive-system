import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/ui';
import { ARABIC_MONTHS, ARABIC_DAY_NAMES } from '@/modules/guiding-light/lib/calendar';
import { formatDateArabic } from '@/modules/shared/utils/format';
import type { CalendarViewMode } from '../types';

const VIEW_MODES: { key: CalendarViewMode; label: string }[] = [
  { key: 'daily', label: 'يومي' },
  { key: 'weekly', label: 'أسبوعي' },
  { key: 'monthly', label: 'شهري' },
];

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = memo(({
  currentDate,
  viewMode,
  onPrevious,
  onNext,
  onViewModeChange,
}) => {
  const month = MONTH_NAMES[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <div className="flex flex-row justify-between items-center flex-none px-5 py-4 bg-card rounded-2xl shadow-sm border border-border/40">
      {/* Title */}
      <div className="flex flex-row items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <div className="flex flex-col items-end">
          <h1
            className="font-bold text-foreground text-[16px]"
            style={{ fontFamily: "'Almarai', sans-serif" }}
          >
            التقويم
          </h1>
          <p
            className="text-muted-foreground text-[11px]"
            style={{ fontFamily: "'Almarai', sans-serif" }}
          >
            عرض الجدول الزمني للاجتماعات
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-row items-center gap-3">
        {/* View mode toggle */}
        <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
          {VIEW_MODES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewModeChange(key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-200',
                viewMode === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Prev / date / Next */}
        <button
          type="button"
          onClick={onPrevious}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          aria-label="السابق"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60">
          <Calendar className="w-4 h-4 text-primary" />
          <span
            className="text-[14px] font-bold text-foreground tabular-nums"
            style={{ fontFamily: "'Almarai', sans-serif" }}
          >
            {viewMode === 'daily'
              ? `${DAY_NAMES[currentDate.getDay()]} ${currentDate.getDate()} ${month} ${year}`
              : `${month} ${year}`}
          </span>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          aria-label="التالي"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';
