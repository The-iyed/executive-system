import React from 'react';
import { cn } from '@sanad-ai/ui';
import type { CalendarEventData } from './WeeklyCalendarGrid';

export type EventType = 'reserved' | 'optional' | 'compulsory' | 'available';

const ROW_HEIGHT_PX = 53;

export interface CalendarEventProps {
  event: CalendarEventData;
  /** Slot time (e.g. "09:00") for computing exact-duration offset when event has exactStartTime */
  slotTime?: string;
  onClick?: (e: React.MouseEvent) => void;
  onBook?: (event: CalendarEventData) => void;
  /** Open full event details (modal). Kept for API compatibility; use onClick to open details. */
  onShowDetails?: (event: CalendarEventData) => void;
  className?: string;
}

/** Compute height and top offset for events with exact start/end times */
function getExactDurationStyle(
  event: CalendarEventData,
  slotTime: string
): React.CSSProperties | undefined {
  if (!event.exactStartTime || !event.exactEndTime) return undefined;
  const [sh, sm] = event.exactStartTime.split(':').map(Number);
  const [eh, em] = event.exactEndTime.split(':').map(Number);
  const [slotH, slotM] = slotTime.split(':').map(Number);
  const startM = (sh ?? 0) * 60 + (sm ?? 0);
  const endM = (eh ?? 0) * 60 + (em ?? 0);
  const slotStartM = (slotH ?? 0) * 60 + (slotM ?? 0);
  const durationM = endM - startM;
  if (durationM <= 0) return undefined;
  const topOffsetPx = ((startM - slotStartM) / 60) * ROW_HEIGHT_PX;
  const heightPx = (durationM / 60) * ROW_HEIGHT_PX;
  return {
    position: 'absolute',
    top: topOffsetPx,
    left: 0,
    right: 0,
    height: heightPx,
    minHeight: heightPx,
    maxHeight: heightPx,
  };
}

const eventTypeStyles: Record<string, { bg: string; border: string; text: string; borderStyle?: string; borderRight?: string; contentStyle?: { text: string; bg: string } }> = {
  reserved: {
    bg: 'bg-[#F1F5F9]',
    border: 'border border-[#D2E0EE]',
    text: 'text-[#000000]',
    borderStyle: 'border-solid',
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
  // Color variants: same design as reserved (Frame 2147240929 - #F1F5F9, #D2E0EE, 7.58px radius)
  variant1: {
    bg: 'bg-[#F1F5F9]',
    border: 'border border-[#D2E0EE]',
    text: 'text-[#000000]',
    borderStyle: 'border-solid',
    contentStyle: { text: 'text-[#475467]', bg: 'bg-[#475467]' },
  },
  variant2: {
    bg: 'bg-[#F1F5F9]',
    border: 'border border-[#D2E0EE]',
    text: 'text-[#000000]',
    borderStyle: 'border-solid',
    contentStyle: { text: 'text-[#475467]', bg: 'bg-[#475467]' },
  },
  variant3: {
    bg: 'bg-[#F1F5F9]',
    border: 'border border-[#D2E0EE]',
    text: 'text-[#000000]',
    borderStyle: 'border-solid',
    contentStyle: { text: 'text-[#475467]', bg: 'bg-[#475467]' },
  },
  variant4: {
    bg: 'bg-[#F1F5F9]',
    border: 'border border-[#D2E0EE]',
    text: 'text-[#000000]',
    borderStyle: 'border-solid',
    contentStyle: { text: 'text-[#475467]', bg: 'bg-[#475467]' },
  },
  variant5: {
    bg: 'bg-[#F1F5F9]',
    border: 'border border-[#D2E0EE]',
    text: 'text-[#000000]',
    borderStyle: 'border-solid',
    contentStyle: { text: 'text-[#475467]', bg: 'bg-[#475467]' },
  },
  variant6: {
    bg: 'bg-[#F1F5F9]',
    border: 'border border-[#D2E0EE]',
    text: 'text-[#000000]',
    borderStyle: 'border-solid',
    contentStyle: { text: 'text-[#475467]', bg: 'bg-[#475467]' },
  },
  /** Card style when is_internal === true */
  internal: {
    bg: 'bg-[#E6F6F4]',
    border: 'border border-[#008774]',
    text: 'text-[#008774]',
    borderStyle: 'border-solid',
    contentStyle: { text: 'text-[#008774]', bg: 'bg-[#008774]' },
  },
  /** Card style when is_internal === false */
  external: {
    bg: 'bg-amber-50',
    border: 'border border-amber-400',
    text: 'text-amber-800',
    borderStyle: 'border-solid',
    contentStyle: { text: 'text-amber-800', bg: 'bg-amber-500' },
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
  slotTime,
  onClick,
  onBook,
  onShowDetails,
  className,
}) => {
  const cardVariant =
    event.is_internal === true ? 'internal' : event.is_internal === false ? 'external' : event.variant || event.type;
  const styles = eventTypeStyles[cardVariant] || eventTypeStyles.reserved;
  const typeLabel = eventTypeLabels[event.type] || 'اجتماع';
  const displayLabel = event.label || typeLabel;
  const isDisabled = !event.is_available && !event.variant;

  const exactStyle = slotTime ? getExactDurationStyle(event, slotTime) : undefined;
  const baseStyle: React.CSSProperties = exactStyle
    ? { ...exactStyle }
    : { minHeight: '53px', maxHeight: '53px' };

  const handleClick = (e: React.MouseEvent) => {
    if (event.id === 'highlighted-slot') return;
    e.stopPropagation();
    if (onBook && event.is_available) {
      onBook(event);
    } else if (onShowDetails) {
      onShowDetails(event);
    } else if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative transition-all w-full min-h-0 flex flex-col justify-center px-2 py-1.5 text-right',
        'rounded-[7.58038px]',
        !exactStyle && 'h-full',
        styles?.bg,
        styles?.border,
        styles?.borderStyle,
        styles?.borderRight,
        isDisabled ? 'cursor-not-allowed opacity-60' : (event.id === 'highlighted-slot' ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'),
        className
      )}
      style={baseStyle}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (event.id !== 'highlighted-slot' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      {event.is_internal !== undefined && (
        <span
          className={cn(
            'absolute top-1 right-1 text-[9px] font-medium px-1.5 py-0.5 rounded leading-tight',
            event.is_internal
              ? 'bg-[#008774] text-white'
              : 'bg-amber-500 text-white'
          )}
          style={{ fontFamily: "'Almarai', sans-serif" }}
        >
          {event.is_internal ? 'داخلي' : 'خارجي'}
        </span>
      )}
      <span
        className={cn('line-clamp-2', styles?.text, event.is_internal !== undefined && 'pr-12')}
        style={{ fontFamily: "'Almarai', sans-serif", fontSize: '12.193px', lineHeight: '120%', letterSpacing: '-0.02em' }}
      >
        {displayLabel}
      </span>
    </div>
  );
};

