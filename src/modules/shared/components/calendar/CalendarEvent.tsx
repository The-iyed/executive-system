import React from 'react';
import { cn } from '@/lib/ui';
import { Clock } from 'lucide-react';
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
  external: '#048F86',
  reserved: '#048F86',
  variant1: '#048F86',
  variant2: '#0D9488',
  variant3: '#059669',
  variant4: '#0D9488',
  variant5: '#10B981',
  variant6: '#14B8A6',
  optional: '#0D9488',
  compulsory: '#048F86',
  available: '#10B981',
};

const BG_COLORS: Record<string, string> = {
  internal: '#F0FDFA',
  external: '#F0FDFA',
  reserved: '#F0FDFA',
  variant1: '#F0FDFA',
  variant2: '#F0FDFA',
  variant3: '#ECFDF5',
  variant4: '#F0FDFA',
  variant5: '#ECFDF5',
  variant6: '#F0FDFA',
  optional: '#F0FDFA',
  compulsory: '#F0FDFA',
  available: '#ECFDF5',
};

const TEXT_COLORS: Record<string, string> = {
  internal: '#115E59',
  external: '#115E59',
  reserved: '#115E59',
  variant1: '#115E59',
  variant2: '#115E59',
  variant3: '#065F46',
  variant4: '#115E59',
  variant5: '#065F46',
  variant6: '#115E59',
  optional: '#115E59',
  compulsory: '#115E59',
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
        'relative w-full h-full min-h-0 flex flex-col justify-center text-right rounded-lg overflow-hidden transition-all duration-200 border-r-0',
        event.id === 'highlighted-slot' ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:brightness-[0.97]',
        className
      )}
      style={{
        background: bgColor,
        minHeight: '48px',
        borderLeft: `3px solid ${accentColor}`,
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (event.id !== 'highlighted-slot' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      <div className="flex flex-col justify-center px-3 py-2 w-full min-w-0 gap-1">
        <span
          className="line-clamp-2 font-bold"
          style={{
            color: textColor,
            fontFamily: "'Almarai', sans-serif",
            fontSize: '12px',
            lineHeight: '140%',
          }}
        >
          {displayLabel}
        </span>
        {event.exactStartTime && event.exactEndTime && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" style={{ color: accentColor, opacity: 0.6 }} />
            <span
              className="text-[10px] font-medium"
              style={{ color: accentColor, opacity: 0.7, fontFamily: "'Almarai', sans-serif" }}
            >
              {event.exactStartTime} – {event.exactEndTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
