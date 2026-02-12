import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@sanad-ai/ui';

export interface WeeklyCalendarNavigationProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onAIGenerate?: () => void;
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
  className,
}) => {
  const month = monthNamesAr[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <div className={cn('flex flex-row items-center gap-[7px]', className)}>
      <button
        type="button"
        onClick={onPreviousWeek}
        className="flex items-center justify-center w-[16.71px] h-[16.71px] rounded-full bg-[#044D4E] text-white hover:opacity-90 transition-opacity"
        aria-label="الأسبوع السابق"
      >
        <ChevronRight className="w-[11.14px] h-[11.14px]" strokeWidth={2.5} />
      </button>

      <span
        className="flex items-center text-center text-[#000000] font-semibold leading-[17px]"
        style={{ fontFamily: "'Almarai', sans-serif", fontSize: '13.9241px', letterSpacing: '0.01em' }}
      >
        {month} {year}
      </span>

      <button
        type="button"
        onClick={onNextWeek}
        className="flex items-center justify-center w-[16.71px] h-[16.71px] rounded-full bg-[#044D4E] text-white hover:opacity-90 transition-opacity"
        aria-label="الأسبوع القادم"
      >
        <ChevronLeft className="w-[11.14px] h-[11.14px]" strokeWidth={2.5} />
      </button>
    </div>
  );
};

