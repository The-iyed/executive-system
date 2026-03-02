import React from 'react';
import { cn } from '@/lib/ui';
import type { CalendarEventData } from './WeeklyCalendarGrid';

export type EventType = 'reserved' | 'optional' | 'compulsory' | 'available';

export interface CalendarEventProps {
  event: CalendarEventData;
  onClick?: (e: React.MouseEvent) => void;
  onBook?: (event: CalendarEventData) => void;
  onShowDetails?: (event: CalendarEventData) => void;
  className?: string;
}

const ACCENT_COLORS: Record<string, string> = {
  internal: '#048F86',
  external: '#D97706',
  reserved: '#048F86',
  variant1: '#048F86',
  variant2: '#0D9488',
  variant3: '#059669',
  variant4: '#D97706',
  variant5: '#10B981',
  variant6: '#14B8A6',
  optional: '#D97706',
  compulsory: '#048F86',
  available: '#10B981',
};

const BG_COLORS: Record<string, string> = {
  internal: 'rgba(4,143,134,0.07)',
  external: 'rgba(217,119,6,0.07)',
  reserved: 'rgba(4,143,134,0.07)',
  variant1: 'rgba(4,143,134,0.07)',
  variant2: 'rgba(13,148,136,0.07)',
  variant3: 'rgba(5,150,105,0.07)',
  variant4: 'rgba(217,119,6,0.07)',
  variant5: 'rgba(16,185,129,0.07)',
  variant6: 'rgba(20,184,166,0.07)',
  optional: 'rgba(217,119,6,0.07)',
  compulsory: 'rgba(4,143,134,0.07)',
  available: 'rgba(16,185,129,0.07)',
};

const TEXT_COLORS: Record<string, string> = {
  internal: '#065F5B',
  external: '#92400E',
  reserved: '#065F5B',
  variant1: '#065F5B',
  variant2: '#0F766E',
  variant3: '#065F46',
  variant4: '#92400E',
  variant5: '#065F46',
  variant6: '#0F766E',
  optional: '#92400E',
  compulsory: '#065F5B',
  available: '#065F46',
};

export const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  onClick,
  onBook,
  onShowDetails,
  className,
}) => {
  const cardVariant =
    event.is_internal === true ? 'internal' : event.is_internal === false ? 'external' : event.variant || event.type;
  const accentColor = ACCENT_COLORS[cardVariant] || ACCENT_COLORS.reserved;
  const bgColor = BG_COLORS[cardVariant] || BG_COLORS.reserved;
  const textColor = TEXT_COLORS[cardVariant] || TEXT_COLORS.reserved;
  const displayLabel = event.label || 'اجتماع';

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
        'relative w-full h-full min-h-0 flex items-center gap-0 text-right rounded-lg overflow-hidden transition-all duration-200',
        event.id === 'highlighted-slot' ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:scale-[1.005]',
        className
      )}
      style={{
        background: bgColor,
        minHeight: '48px',
        borderRight: `3px solid ${accentColor}`,
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (event.id !== 'highlighted-slot' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      <div className="flex flex-col justify-center px-3 py-2 w-full min-w-0">
        {event.is_internal !== undefined && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded w-fit mb-1 leading-tight"
            style={{
              background: accentColor + '18',
              color: accentColor,
              fontFamily: "'Almarai', sans-serif",
            }}
          >
            {event.is_internal ? 'داخلي' : 'خارجي'}
          </span>
        )}
        <span
          className="line-clamp-2 font-semibold"
          style={{
            color: textColor,
            fontFamily: "'Almarai', sans-serif",
            fontSize: '11.5px',
            lineHeight: '150%',
            letterSpacing: '-0.01em',
          }}
        >
          {displayLabel}
        </span>
        {event.exactStartTime && event.exactEndTime && (
          <span
            className="text-[10px] mt-0.5 opacity-50 font-medium"
            style={{ color: textColor, fontFamily: "'Almarai', sans-serif" }}
          >
            {event.exactStartTime} – {event.exactEndTime}
          </span>
        )}
      </div>
    </div>
  );
};
