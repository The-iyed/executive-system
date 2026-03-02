import React from 'react';
import { cn } from '@/lib/ui';
import { CalendarEvent, type EventType } from './CalendarEvent';

/** Organizer for calendar event (from Outlook) */
export interface CalendarEventOrganizer {
  name: string;
  email: string;
}

/** Attachment for calendar event (from Outlook) */
export interface CalendarEventAttachment {
  name: string;
  content_type: string;
  size: number;
  is_inline: boolean;
  attachment_id: string;
}

export interface CalendarEventData {
  id: string;
  type: EventType;
  label: string;
  variant?: string;
  startTime: string;
  endTime: string;
  date: Date;
  title?: string;
  description?: string;
  is_selected?: boolean;
  is_available?: boolean;
  exactStartTime?: string;
  exactEndTime?: string;
  is_internal?: boolean;
  fullBody?: string | null;
  location?: string | null;
  organizer?: CalendarEventOrganizer;
  attachments?: CalendarEventAttachment[] | null;
}

export interface WeeklyCalendarGridProps {
  weekStart: Date;
  events: CalendarEventData[];
  onEventClick?: (event: CalendarEventData) => void;
  onEventBook?: (event: CalendarEventData) => void;
  onEventShowDetails?: (event: CalendarEventData) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  startHour?: number;
  endHour?: number;
}

const dayNamesShort = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const getWeekDates = (weekStart: Date): Date[] => {
  const dates: Date[] = [];
  const base = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), 0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isToday = (date: Date): boolean => isSameCalendarDay(date, new Date());

/** Format time slot: "08:00" -> "08 ص", "13:00" -> "01 م" */
const formatTimeLabelArabic = (time: string): string => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 0 && hour <= 11) return `${hour.toString().padStart(2, '0')} ص`;
  if (hour === 12) return '12 م';
  return `${(hour - 12).toString().padStart(2, '0')} م`;
};

const isSlotInPast = (date: Date, time: string): boolean => {
  const [h = 0] = time.split(':').map(Number);
  const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0, 0, 0);
  return slotStart.getTime() <= Date.now();
};

const getEventsForSlot = (slotDate: Date, time: string, events: CalendarEventData[]): CalendarEventData[] =>
  events.filter((event) => {
    const eventStart = new Date(event.date);
    if (!isSameCalendarDay(eventStart, slotDate)) return false;
    const timeHour = parseInt(time.split(':')[0], 10);
    const startHour = parseInt(event.startTime.split(':')[0], 10);
    const endHour = parseInt(event.endTime.split(':')[0], 10);
    if (startHour === endHour) return timeHour === startHour;
    return timeHour >= startHour && timeHour < endHour;
  });

const getEventsStartingAtSlot = (slotDate: Date, time: string, events: CalendarEventData[]): CalendarEventData[] =>
  events.filter((event) => {
    const eventStart = new Date(event.date);
    if (!isSameCalendarDay(eventStart, slotDate)) return false;
    return event.startTime === time;
  });

const isSlotCoveredByLongEvent = (slotDate: Date, time: string, events: CalendarEventData[]): boolean =>
  events.some((event) => {
    const eventStart = new Date(event.date);
    if (!isSameCalendarDay(eventStart, slotDate)) return false;
    const timeHour = parseInt(time.split(':')[0], 10);
    const startHour = parseInt(event.startTime.split(':')[0], 10);
    const endHour = parseInt(event.endTime.split(':')[0], 10);
    return timeHour > startHour && timeHour < endHour;
  });

const ROW_HEIGHT_PX = 56;

const eventSpanRows = (event: CalendarEventData): number => {
  const startH = parseInt(event.startTime.split(':')[0], 10);
  const endH = parseInt(event.endTime.split(':')[0], 10);
  return Math.max(1, endH - startH);
};

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  weekStart,
  events,
  onEventClick,
  onEventBook,
  onEventShowDetails,
  onTimeSlotClick,
  startHour = 8,
  endHour = 24,
}) => {
  const weekDates = getWeekDates(weekStart);

  const timeSlots = React.useMemo(() => {
    const slots = [];
    for (let i = startHour; i <= endHour; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, [startHour, endHour]);

  return (
    <div className="w-full min-h-0 flex flex-col rounded-2xl overflow-hidden" dir="rtl">
      {/* ── Day header row ── */}
      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_56px] shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200">
        {weekDates.map((date, index) => {
          const dayName = dayNamesShort[date.getDay()];
          const dayNumber = date.getDate();
          const today = isToday(date);
          return (
            <div
              key={index}
              className={cn(
                'flex flex-col justify-center items-center py-3 px-2 text-center transition-colors',
                index < 6 && 'border-l border-gray-100',
                today && 'bg-[#048F86]/[0.04]',
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center text-[17px] font-bold mb-0.5',
                  today ? 'bg-[#048F86] text-white shadow-sm' : 'text-gray-800'
                )}
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                {dayNumber}
              </div>
              <div
                className={cn(
                  'text-[11px] font-medium',
                  today ? 'text-[#048F86]' : 'text-gray-400'
                )}
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                {dayName}
              </div>
            </div>
          );
        })}
        {/* Time column header */}
        <div className="border-l border-gray-100 flex items-center justify-center">
          <span className="text-[10px] text-gray-300 font-medium" style={{ fontFamily: "'Almarai', sans-serif" }}>الوقت</span>
        </div>
      </div>

      {/* ── Time grid ── */}
      <div
        className="grid grid-cols-[repeat(7,minmax(0,1fr))_56px] min-h-0 flex-1"
        style={{ gridAutoRows: `${ROW_HEIGHT_PX}px` }}
      >
        {timeSlots.map((time, timeIndex) => (
          <React.Fragment key={time}>
            {weekDates.map((date, dayIndex) => {
              const startingEvents = getEventsStartingAtSlot(date, time, events);
              const covered = isSlotCoveredByLongEvent(date, time, events);
              const slotEventsForBlocking = getEventsForSlot(date, time, events);
              const hasAvailableSlot = slotEventsForBlocking.some((event) => event.is_available);
              const isBlockedByEvent = slotEventsForBlocking.length > 0 && !hasAvailableSlot;
              const isPast = onTimeSlotClick != null && isSlotInPast(date, time);
              const isSlotClickable = !isBlockedByEvent && !isPast && !covered;
              const today = isToday(date);

              const spanRows = startingEvents.length > 0
                ? Math.max(...startingEvents.map(eventSpanRows), 1)
                : 1;

              const row = timeIndex + 1;
              const col = dayIndex + 1;

              if (covered) {
                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      'border-b border-gray-100 pointer-events-none relative z-0',
                      dayIndex < 6 && 'border-l border-gray-50',
                      today && 'bg-[#048F86]/[0.02]',
                    )}
                    style={{
                      minHeight: ROW_HEIGHT_PX,
                      gridRow: row,
                      gridColumn: col,
                    }}
                    aria-hidden
                  />
                );
              }

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'flex flex-row gap-0.5 overflow-hidden shrink-0 transition-all duration-150 border-b border-gray-100',
                    dayIndex < 6 && 'border-l border-gray-50',
                    today && 'bg-[#048F86]/[0.02]',
                    startingEvents.length === 0 && isSlotClickable && 'cursor-pointer hover:bg-[#048F86]/[0.04]',
                    startingEvents.length === 0 && !isSlotClickable && 'cursor-not-allowed',
                    isPast && startingEvents.length === 0 && 'opacity-40',
                  )}
                  style={{
                    gridRow: spanRows > 1 ? `${row} / span ${spanRows}` : row,
                    gridColumn: col,
                    zIndex: startingEvents.length > 0 ? 1 : undefined,
                    padding: startingEvents.length > 0 ? '2px' : undefined,
                  }}
                  onClick={startingEvents.length === 0 && isSlotClickable ? () => onTimeSlotClick?.(date, time) : undefined}
                >
                  {startingEvents.map((event) => (
                    <div key={event.id} className="min-w-0 flex-1 h-full overflow-hidden">
                      <CalendarEvent
                        event={event}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        onBook={onEventBook}
                        onShowDetails={onEventShowDetails}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
            {/* Time Label */}
            <div
              className="flex items-start justify-center pt-1 border-b border-gray-100 border-l border-gray-50"
              style={{
                minHeight: ROW_HEIGHT_PX,
                gridRow: timeIndex + 1,
                gridColumn: 8,
              }}
            >
              <span
                className="text-[11px] font-medium text-gray-400 tabular-nums"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                {formatTimeLabelArabic(time)}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
