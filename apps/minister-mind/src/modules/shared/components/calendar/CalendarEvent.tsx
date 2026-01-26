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

const eventTypeStyles: Record<string, { bg: string; border: string; text: string; borderStyle?: string; borderRight?: string, contentStyle?: { text: string; bg: string; } }> = {
  reserved: {
    bg: 'bg-[#F9FAFB]',
    border: 'border-[#EAECF0]',
    text: 'text-[#475467]',
    borderStyle: 'border-solid',
    borderRight: 'border-r-[#D0D5DD] border-r-[2px]',
    contentStyle: {
      text: 'text-[#475467]',
      bg: 'bg-[#475467]',
    },
  },
  optional: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-[2px] border-solid border-amber-400',
    contentStyle: {
      text: 'text-amber-800',
      bg: 'bg-amber-500',
    },
  },
  compulsory: {
    bg: 'bg-[#E6F6F4]',
    text: 'text-[#008774]',
    border: 'border-[1px] border-dashed border-[#008774]',
    contentStyle: {
      text: 'text-[#0E6F90]',
      bg: 'bg-[#0E6F90]',
    },
  },
  available: {
    bg: 'bg-[#F5FEFF]',
    text: 'text-[#0E6F90]',
    border: 'border-[1px] border-dashed border-[#0E7090]',
  },
  // Color variants for random coloring
  variant1: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    borderStyle: 'border-solid',
    borderRight: 'border-r-blue-500 border-r-[2px]',
    contentStyle: { text: 'text-blue-700', bg: 'bg-blue-600' },
  },
  variant2: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    borderStyle: 'border-solid',
    borderRight: 'border-r-purple-500 border-r-[2px]',
    contentStyle: { text: 'text-purple-700', bg: 'bg-purple-600' },
  },
  variant3: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    borderStyle: 'border-solid',
    borderRight: 'border-r-pink-500 border-r-[2px]',
    contentStyle: { text: 'text-pink-700', bg: 'bg-pink-600' },
  },
  variant4: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    borderStyle: 'border-solid',
    borderRight: 'border-r-green-500 border-r-[2px]',
    contentStyle: { text: 'text-green-700', bg: 'bg-green-600' },
  },
  variant5: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    borderStyle: 'border-solid',
    borderRight: 'border-r-orange-500 border-r-[2px]',
    contentStyle: { text: 'text-orange-700', bg: 'bg-orange-600' },
  },
  variant6: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    borderStyle: 'border-solid',
    borderRight: 'border-r-cyan-500 border-r-[2px]',
    contentStyle: { text: 'text-cyan-700', bg: 'bg-cyan-600' },
  },
};

const eventTypeLabels: Record<string, string> = {
  reserved: 'محجوز',
  optional: 'اختياري',
  compulsory: 'إجباري',
  available: 'متاح',
};

const monthNames = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
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
  // Use custom variant if provided, otherwise fallback to type
  const styles = eventTypeStyles[event.variant || event.type] || eventTypeStyles.reserved;
  const typeLabel = eventTypeLabels[event.type] || 'اجتماع';
  // Use event.label if provided, otherwise use the default typeLabel
  const displayLabel = event.label || typeLabel;
  // Check if event is disabled (for unavailable slots that can't be selected)
  // If it has a custom variant, we might want it to still look active even if it's not "available" for booking
  const isDisabled = !event.is_available && !event.variant;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'relative transition-all',
            'w-full h-full',
            'flex items-center justify-center text-center px-1',
            styles?.bg,
            styles?.border,
            styles?.borderStyle,
            styles?.borderRight,
            isDisabled ? 'cursor-not-allowed opacity-60' : (event.id === 'highlighted-slot' ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'),
            className
          )}
          onClick={event.id === 'highlighted-slot' ? undefined : onClick}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <span className={cn('text-[12px] font-weight-700 leading-tight line-clamp-2', styles?.text)}>
            {displayLabel}
          </span>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className=" min-w-[200px] max-w-[240px] rounded-[12px] bg-white p-4 flex flex-col items-start gap-2 shadow-xl border-[#EAECF0] z-[50]"
        align="center"
        side="top"
        sideOffset={8}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="w-full flex justify-between items-start mb-1">
          <div className="flex flex-col gap-0.5">
            <h3 className={cn('text-[14px] font-weight-700 font-bold', styles?.contentStyle?.text)}>
              {event.title || 'موعد الاجتماع'}
            </h3>
            {event.is_selected && (
              <span className="text-[10px] text-amber-600 font-bold">الموعد المختار لهذا الاجتماع</span>
            )}
          </div>
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full bg-opacity-10 text-white', styles?.contentStyle?.bg)}>
            {typeLabel}
          </span>
        </div>
        <p className="text-[12px] font-weight-500 text-[#475467]">
          {formatDate(event.date)}
        </p>
        <p className="text-[12px] font-weight-600 text-[#101828]">
          من {event.exactStartTime || event.startTime} إلى {event.exactEndTime || event.endTime}
        </p>

        {event.description && (
          <p className="text-[12px] text-[#475467] mt-2 border-t pt-2 border-gray-100 w-full">
            {event.description}
          </p>
        )}
        {onBook && event.is_available && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBook(event);
            }}
            className={cn(
              'w-full mt-2 px-4 py-2 text-white transition-colors font-weight-700 text-[14px] rounded-[8px] border-none shadow-sm',
              styles?.contentStyle?.bg,
            )}
          >
            {event.is_selected ? 'إلغاء الحجز' : 'حجز الموعد'}
          </button>
        )}
        {onClick && !onBook && event.id !== 'highlighted-slot' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick(e);
            }}
            className={cn(
              'w-full mt-2 px-4 py-2 text-white transition-colors font-weight-700 text-[14px] rounded-[8px] border-none shadow-sm',
              styles?.contentStyle?.bg,
            )}
          >
            عرض التفاصيل
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

