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

/* ── Accent color per variant (left/right border strip) ── */
const ACCENT_COLORS: Record<string, string> = {
  internal: '#048F86',
  external: '#F59E0B',
  reserved: '#3C6FD1',
  variant1: '#3C6FD1',
  variant2: '#8B5CF6',
  variant3: '#EC4899',
  variant4: '#F59E0B',
  variant5: '#10B981',
  variant6: '#6366F1',
  optional: '#F59E0B',
  compulsory: '#048F86',
  available: '#10B981',
};

const BG_COLORS: Record<string, string> = {
  internal: 'rgba(4,143,134,0.08)',
  external: 'rgba(245,158,11,0.08)',
  reserved: 'rgba(60,111,209,0.06)',
  variant1: 'rgba(60,111,209,0.06)',
  variant2: 'rgba(139,92,246,0.06)',
  variant3: 'rgba(236,72,153,0.06)',
  variant4: 'rgba(245,158,11,0.06)',
  variant5: 'rgba(16,185,129,0.06)',
  variant6: 'rgba(99,102,241,0.06)',
  optional: 'rgba(245,158,11,0.06)',
  compulsory: 'rgba(4,143,134,0.06)',
  available: 'rgba(16,185,129,0.06)',
};

const TEXT_COLORS: Record<string, string> = {
  internal: '#065F5B',
  external: '#92400E',
  reserved: '#1E40AF',
  variant1: '#1E40AF',
  variant2: '#5B21B6',
  variant3: '#9D174D',
  variant4: '#92400E',
  variant5: '#065F46',
  variant6: '#3730A3',
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
        'relative w-full h-full min-h-0 flex items-center gap-0 text-right rounded-xl overflow-hidden transition-all duration-200',
        event.id === 'highlighted-slot' ? 'cursor-default' : 'cursor-pointer hover:shadow-lg hover:scale-[1.01]',
        className
      )}
      style={{
        background: bgColor,
        minHeight: '48px',
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (event.id !== 'highlighted-slot' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      {/* Colored accent strip */}
      <div
        className="absolute top-1 bottom-1 right-0 w-[3px] rounded-full"
        style={{ background: accentColor }}
      />

      <div className="flex flex-col justify-center px-3 py-1.5 pr-4 w-full min-w-0">
        {/* Internal/External badge */}
        {event.is_internal !== undefined && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md w-fit mb-0.5 leading-tight"
            style={{
              background: accentColor + '20',
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
            lineHeight: '140%',
            letterSpacing: '-0.01em',
          }}
        >
          {displayLabel}
        </span>
        {event.exactStartTime && event.exactEndTime && (
          <span
            className="text-[9px] mt-0.5 opacity-60 font-medium"
            style={{ color: textColor, fontFamily: "'Almarai', sans-serif" }}
          >
            {event.exactStartTime} – {event.exactEndTime}
          </span>
        )}
      </div>
    </div>
  );
};
