import React from 'react';
import { cn } from '@/lib/ui';
import { Clock } from 'lucide-react';
import type { CalendarEventData } from './WeeklyCalendarGrid';

export type EventType = 'reserved' | 'optional' | 'compulsory' | 'available';

const ROW_HEIGHT_PX = 53;

export interface CalendarEventProps {
  event: CalendarEventData;
  /** Slot time (e.g. "09:00") for computing exact-duration offset when event has exactStartTime */
  slotTime?: string;
  onClick?: (e: React.MouseEvent) => void;
  onBook?: (event: CalendarEventData) => void;
  onShowDetails?: (event: CalendarEventData) => void;
  className?: string;
}

const ACCENT_COLORS: Record<string, string> = {
  internal: '#048F86',
  external: '#D97706',
  reserved: '#3B82F6',
  variant1: '#048F86',
  variant2: '#6366F1',
  variant3: '#D97706',
  variant4: '#3B82F6',
  variant5: '#8B5CF6',
  variant6: '#0891B2',
  optional: '#D97706',
  compulsory: '#048F86',
  available: '#10B981',
};

const BG_COLORS: Record<string, string> = {
  internal: '#F0FDFA',
  external: '#FFFBEB',
  reserved: '#EFF6FF',
  variant1: '#F0FDFA',
  variant2: '#EEF2FF',
  variant3: '#FFFBEB',
  variant4: '#EFF6FF',
  variant5: '#F5F3FF',
  variant6: '#ECFEFF',
  optional: '#FFFBEB',
  compulsory: '#F0FDFA',
  available: '#ECFDF5',
};

const TEXT_COLORS: Record<string, string> = {
  internal: '#115E59',
  external: '#92400E',
  reserved: '#1E40AF',
  variant1: '#115E59',
  variant2: '#3730A3',
  variant3: '#92400E',
  variant4: '#1E40AF',
  variant5: '#5B21B6',
  variant6: '#155E75',
  optional: '#92400E',
  compulsory: '#115E59',
  available: '#065F46',
};

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

export const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  slotTime,
  onClick,
  onBook,
  onShowDetails,
  className,
}) => {
  // Always use the hash-based variant for color variety; fall back to type
  const cardVariant = event.variant || event.type;
  const accentColor = ACCENT_COLORS[cardVariant] || ACCENT_COLORS.reserved;
  const bgColor = BG_COLORS[cardVariant] || BG_COLORS.reserved;
  const textColor = TEXT_COLORS[cardVariant] || TEXT_COLORS.reserved;
  const displayLabel = event.label || 'اجتماع';

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
        'relative w-full h-full min-h-0 flex flex-col justify-center text-right rounded-lg overflow-hidden transition-all duration-200 border-r-0',
        event.id === 'highlighted-slot' ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:brightness-[0.97]',
        className
      )}
      style={{
        ...baseStyle,
        background: bgColor,
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
