import React from 'react';
import { cn, Popover, PopoverTrigger, PopoverContent } from '@sanad-ai/ui';
import type { CalendarEventData } from './WeeklyCalendarGrid';

export type EventType = 'reserved' | 'optional' | 'compulsory' | 'available';

export interface CalendarEventProps {
  event: CalendarEventData;
  onClick?: (e: React.MouseEvent) => void;
  onBook?: (event: CalendarEventData) => void;
  className?: string;
}

const eventTypeStyles: Record<EventType, { bg: string; border: string; text: string; borderStyle?: string; borderRight?: string, contentStyle?: { text: string; bg: string; } }> = {
  reserved: {
    bg: 'bg-[#EAECF0]',
    border: 'border-[#D0D5DD]',
    text: 'text-[#98A2B3]',
    borderStyle: 'border-solid',
    borderRight: 'border-r-[#344054] border-r-[2px]',
    contentStyle: {
      text: 'text-[#008774]',
      bg: 'bg-[#009883]',
      // border: 'border-[1px] border-[#009883]',
    },
  },
  optional: {
    bg: 'bg-[#FFFCF5]',
    text: 'text-[#B54708]',
    border: 'border-[1px] border-dashed border-[#B54708]',
    contentStyle: {
      text: 'text-[#B54708]',
      bg: 'bg-[#B54708]',
      // border: 'border-[1px] border-[#B54708]',
    },
  },
  compulsory: {
    bg: 'bg-[#E6F6F4]',
    text: 'text-[#008774]',
    border: 'border-[1px] border-dashed border-[#008774]',
    contentStyle: {
      text: 'text-[#0E6F90]',
      bg: 'bg-[#0E6F90]',
      // border: 'border-[1px] border-[#0E6F90]',
    },
  },
  available: {
    bg: 'bg-[#F5FEFF]',
    text: 'text-[#0E6F90]',
    border: 'border-[1px] border-dashed border-[#0E7090]',
  },
};

const eventTypeLabels: Record<EventType, string> = {
  reserved: 'محجوز',
  optional: 'اختياري',
  compulsory: 'إجباري',
  available: 'متاح',
};

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

export const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  onClick,
  onBook,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const styles = eventTypeStyles[event.type];
  const typeLabel = eventTypeLabels[event.type];
  // Use event.label if provided, otherwise use the default typeLabel
  const displayLabel = event.label || typeLabel;
  // Check if event is disabled (for unavailable slots that can't be selected)
  const isDisabled = !event.is_available;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'relative transition-all',
            'w-full h-full',
            'flex items-center justify-center',
            styles?.bg,
            styles?.border,
            styles?.borderStyle,
            styles?.borderRight,
            isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-md',
            className
          )}
          onClick={isDisabled ? undefined : onClick}
          onMouseEnter={() => !isDisabled && setOpen(true)}
          onMouseLeave={() => !isDisabled && setOpen(false)}
        >
          <span className={cn('text-[14px] font-weight-700', styles?.text)}>
            {displayLabel}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className=" min-w-[180px] max-w-[180px] rounded-[8px] bg-white p-4 flex flex-col items-start gap-2"
        align="center"
        side="top"
        sideOffset={8}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <h3 className={cn('text-[12px] font-weight-700 font-bold text-[#101828]', styles?.contentStyle?.text)}>
          {event.title || 'موعد الاجتماع'}
        </h3>
        <p className="text-[12px] font-weight-500 font-bold text-[#000000]">
          {formatDate(event.date)}، من الساعة {event.startTime} إلى {event.endTime}
        </p>
        {event.description && (
          <p className="text-[14px] text-[#344054] mb-4">
            {event.description}
          </p>
        )}
        {onBook && !isDisabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBook(event);
            }}
            className={cn(
              'w-full px-4 py-2 text-white transition-colors font-weight-700 text-[14px] rounded-[8px] border-none box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)]',
              styles?.contentStyle?.bg,
            )}
          >
            {event.is_selected ? 'إلغاء الحجز' : 'حجز الموعد'}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};
