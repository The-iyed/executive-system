import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/ui';

export type CalendarViewMode = 'weekly' | 'monthly' | 'daily';

export interface WeeklyCalendarNavigationProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onAIGenerate?: () => void;
  viewMode?: CalendarViewMode;
  onViewModeChange?: (mode: CalendarViewMode) => void;
  className?: string;
}

const monthNamesAr = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const WeeklyCalendarNavigation: React.FC<WeeklyCalendarNavigationProps> = ({
  currentDate,
  onPreviousWeek,
  onNextWeek,
  viewMode = 'weekly',
  onViewModeChange,
  className,
}) => {
  const month = monthNamesAr[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <div className={cn('flex flex-row items-center gap-3', className)}>
      {/* View mode toggle */}
      {onViewModeChange && (
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('daily')}
            className={cn(
              'px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-200',
              viewMode === 'daily'
                ? 'bg-[#048F86] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
          >
            يومي
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('weekly')}
            className={cn(
              'px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-200',
              viewMode === 'weekly'
                ? 'bg-[#048F86] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
          >
            أسبوعي
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('monthly')}
            className={cn(
              'px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-200',
              viewMode === 'monthly'
                ? 'bg-[#048F86] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
          >
            شهري
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onPreviousWeek}
        className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 text-gray-600 hover:bg-[#048F86] hover:text-white transition-all duration-200"
        aria-label="الأسبوع السابق"
      >
        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
      </button>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50">
        <Calendar className="w-4 h-4 text-[#048F86]" />
        <span
          className="text-[14px] font-bold text-gray-800 tabular-nums"
          style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
        >
          {month} {year}
        </span>
      </div>

      <button
        type="button"
        onClick={onNextWeek}
        className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 text-gray-600 hover:bg-[#048F86] hover:text-white transition-all duration-200"
        aria-label="الأسبوع القادم"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
};
