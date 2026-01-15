import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AIGenerateButton } from '@shared';

export interface WeeklyCalendarNavigationProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onAIGenerate?: () => void;
}

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const WeeklyCalendarNavigation: React.FC<WeeklyCalendarNavigationProps> = ({
  currentDate,
  onPreviousWeek,
  onNextWeek,
  onAIGenerate,
}) => {
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-between w-full mb-6">
      {onAIGenerate && (
        <AIGenerateButton onClick={onAIGenerate} />
      )}
      
      <div className="flex items-center gap-12">
        <button
          type="button"
          onClick={onPreviousWeek}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F9FAFB] transition-colors"
          aria-label="الأسبوع السابق"
        >
          <ChevronRight className="w-5 h-5 text-[#344054]" />
        </button>
        
        <h2 className="text-[16px] font-bold text-[#344054]">
          {month} {year}
        </h2>
        
        <button
          type="button"
          onClick={onNextWeek}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F9FAFB] transition-colors"
          aria-label="الأسبوع القادم"
        >
          <ChevronLeft className="w-5 h-5 text-[#344054]" />
        </button>
      </div>
    </div>
  );
};
