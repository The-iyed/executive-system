import React from 'react';
import { cn } from '@/lib/ui';
import { Clock, MapPin, Plus } from 'lucide-react';
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

/** Get organizer initials (first letter of first name) */
function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  slotTime,
  onClick,
  onBook,
  onShowDetails,
  className,
}) => {
  const cardVariant = event.variant || event.type;
  const accentColor = ACCENT_COLORS[cardVariant] || ACCENT_COLORS.reserved;
  const bgColor = BG_COLORS[cardVariant] || BG_COLORS.reserved;
  const textColor = TEXT_COLORS[cardVariant] || TEXT_COLORS.reserved;
  const displayLabel = event.label || 'اجتماع';
  const isAvailable = event.is_available || event.type === 'available';
  const isSelected = event.is_selected;

  const exactStyle = slotTime ? getExactDurationStyle(event, slotTime) : undefined;
  const baseStyle: React.CSSProperties = exactStyle
    ? { ...exactStyle }
    : { minHeight: '53px', maxHeight: '53px' };

  // Determine layout based on event height
  const eventHeightPx = exactStyle?.height as number | undefined;
  const isVeryShort = eventHeightPx !== undefined && eventHeightPx < 24; // < ~27min
  const isShort = eventHeightPx !== undefined && eventHeightPx < 44;     // < ~50min

  // Native tooltip for full info on hover (especially useful for short events)
  const tooltipParts = [
    displayLabel,
    event.exactStartTime && event.exactEndTime ? `${event.exactStartTime} – ${event.exactEndTime}` : null,
    event.location ?? null,
    event.organizer ? event.organizer.name : null,
  ].filter(Boolean);
  const tooltipText = tooltipParts.join('\n');

  const handleClick = (e: React.MouseEvent) => {
    if (event.id === 'highlighted-slot') return;
    e.stopPropagation();
    if (onBook && isAvailable) {
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
      title={tooltipText}
      className={cn(
        'relative w-full h-full min-h-0 flex flex-col justify-start text-right rounded-lg overflow-hidden transition-all duration-200',
        isAvailable
          ? 'border border-dashed'
          : 'border border-transparent',
        event.id === 'highlighted-slot' ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:brightness-[0.97]',
        className
      )}
      style={{
        ...baseStyle,
        background: bgColor,
        borderColor: isAvailable ? accentColor : 'transparent',
        boxShadow: isSelected ? `0 0 0 2px ${accentColor}, 0 0 0 4px ${accentColor}22` : undefined,
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (event.id !== 'highlighted-slot' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      {/* Leading-edge accent bar (right side in RTL) */}
      <div
        className="absolute top-0 right-0 bottom-0 w-[3px]"
        style={{ background: accentColor }}
        aria-hidden
      />

      <div className={cn(
        'flex flex-col justify-center w-full min-w-0',
        isVeryShort ? 'pr-4 pl-2' : 'pr-5 pl-3 py-2 gap-1'
      )}>
        {/* Available slot CTA */}
        {isAvailable && !isVeryShort && (
          <div className="flex items-center gap-1 mb-0.5">
            <Plus className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
            <span
              className="text-[10px] font-semibold"
              style={{ color: accentColor, fontFamily: "'Almarai', sans-serif" }}
            >
              متاح للحجز
            </span>
          </div>
        )}

        {/* Title */}
        <span
          className={isShort ? 'truncate font-bold' : 'line-clamp-2 font-bold'}
          style={{
            color: textColor,
            fontFamily: "'Almarai', sans-serif",
            fontSize: isVeryShort ? '10px' : '12px',
            lineHeight: '140%',
          }}
        >
          {displayLabel}
        </span>

        {/* Time row */}
        {!isShort && event.exactStartTime && event.exactEndTime && (
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

        {/* Location row */}
        {!isShort && event.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor, opacity: 0.5 }} />
            <span
              className="truncate text-[10px] font-medium"
              style={{ color: accentColor, opacity: 0.65, fontFamily: "'Almarai', sans-serif" }}
            >
              {event.location}
            </span>
          </div>
        )}
      </div>

      {/* Organizer initials avatar — bottom-left corner for full-size events */}
      {!isShort && event.organizer?.name && (
        <div
          className="absolute bottom-1.5 left-2 w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px] font-bold select-none"
          style={{ background: accentColor, opacity: 0.75 }}
          aria-label={event.organizer.name}
        >
          {getInitial(event.organizer.name)}
        </div>
      )}
    </div>
  );
};
