import React from 'react';
import { cn } from '@sanad-ai/ui';
import type { CalendarEventData } from './WeeklyCalendarGrid';

export interface EventDetailPopupProps {
  event: CalendarEventData | null;
  position: { x: number; y: number } | null;
  onBook?: (event: CalendarEventData) => void;
}

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const formatDate = (date: Date): string => {
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  return `${dayName} ${day} ${month}`;
};

export const EventDetailPopup: React.FC<EventDetailPopupProps> = ({
  event,
  position,
  onBook,
}) => {
  if (!event || !position) return null;

  return (
    <div
      className={cn(
        'fixed z-50 bg-white rounded-lg shadow-lg border border-[#D0D5DD] p-4',
        'min-w-[280px] max-w-[320px]'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <h3 className="text-[16px] font-bold text-[#101828] mb-2">
        {event.title || 'موعد الاجتماع'}
      </h3>
      <p className="text-[14px] text-[#667085] mb-4">
        {formatDate(event.date)}، من الساعة {event.startTime} إلى {event.endTime}
      </p>
      {event.description && (
        <p className="text-[14px] text-[#344054] mb-4">
          {event.description}
        </p>
      )}
      {onBook && (
        <button
          type="button"
          onClick={() => onBook(event)}
          className="w-full px-4 py-2 bg-[#009883] text-white rounded-lg hover:bg-[#008774] transition-colors font-medium text-[14px]"
        >
          حجز الموعد
        </button>
      )}
    </div>
  );
};
