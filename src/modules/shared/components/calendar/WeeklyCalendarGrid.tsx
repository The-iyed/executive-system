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
  attendees?: Array<{ name: string; email?: string | null }> | null;
  /** When present, event can be edited via PATCH scheduled-meeting (show Edit button) */
  meeting_id?: string | null;
  /** Pre-fill edit drawer from API when available */
  meeting_title?: string | null;
  meeting_channel?: string | null;
  meeting_location?: string | null;
  meeting_link?: string | null;
}

export interface WeeklyCalendarGridProps {
  weekStart: Date;
  events: CalendarEventData[];
  /** When set, show only this single day (daily view) instead of the full week */
  singleDay?: Date;
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
  const [h = 0, min = 0] = time.split(':').map(Number);
  const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min, 0, 0);
  return slotStart.getTime() <= Date.now();
};

const parseTimeToMinutes = (t: string): number => {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
};

const formatMinutesToTime = (totalMin: number): string => {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/** Event occupancy [startRel, endRel) within this hour row (0–60), for one event */
const getEventOccupancyRelativeToHour = (
  slotTime: string,
  ev: CalendarEventData
): [number, number] => {
  const slotStartMin = parseTimeToMinutes(slotTime);
  const hourEndAbs = slotStartMin + 60;
  let startAbs: number;
  let endAbs: number;
  if (ev.exactStartTime && ev.exactEndTime) {
    startAbs = parseTimeToMinutes(ev.exactStartTime);
    endAbs = parseTimeToMinutes(ev.exactEndTime);
  } else {
    startAbs = parseTimeToMinutes(ev.startTime);
    endAbs = parseTimeToMinutes(ev.endTime);
    if (endAbs <= startAbs) endAbs = startAbs + 60;
  }
  const lo = Math.max(0, Math.min(60, Math.max(slotStartMin, startAbs) - slotStartMin));
  const hi = Math.max(0, Math.min(60, Math.min(hourEndAbs, endAbs) - slotStartMin));
  return [lo, Math.max(lo, hi)];
};

/**
 * Parallel meetings (same hour, side‑by‑side columns) each get their own vertical free band.
 * Merging all intervals into one timeline wrongly hides e.g. 4:30–5:00 when one column is 4–4:30 and another 4–5.
 */
const getPerColumnFreeSlots = (
  slotTime: string,
  startingEvents: CalendarEventData[]
): { fromRel: number; toRel: number; columnIndex: number; columnCount: number }[] => {
  const n = startingEvents.length;
  if (n === 0) return [];
  const out: { fromRel: number; toRel: number; columnIndex: number; columnCount: number }[] = [];
  startingEvents.forEach((ev, columnIndex) => {
    const [, endRel] = getEventOccupancyRelativeToHour(slotTime, ev);
    if (endRel >= 60 - 4) return;
    out.push({ fromRel: endRel, toRel: 60, columnIndex, columnCount: n });
  });
  return out;
};

/** Single-track free time when only one column or no parallel overlap concern — full width */
const getMergedFreeSubSlotsRelative = (
  slotTime: string,
  startingEvents: CalendarEventData[]
): [number, number][] => {
  const intervals: [number, number][] = startingEvents.map((ev) =>
    getEventOccupancyRelativeToHour(slotTime, ev)
  );
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [a, b] of intervals) {
    if (!merged.length || a > merged[merged.length - 1][1]) merged.push([a, b]);
    else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], b);
  }
  const free: [number, number][] = [];
  let cursor = 0;
  for (const [a, b] of merged) {
    if (a > cursor) free.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (cursor < 60) free.push([cursor, 60]);
  return free;
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

/** Events that **start** at this (date, time) – render once here and span duration. For exact times, match by hour. */
const getEventsStartingAtSlot = (slotDate: Date, time: string, events: CalendarEventData[]): CalendarEventData[] =>
  events.filter((event) => {
    const eventStart = new Date(event.date);
    if (!isSameCalendarDay(eventStart, slotDate)) return false;
    if (event.startTime === time) return true;
    if (event.exactStartTime) {
      const slotHour = time.split(':')[0];
      const eventHour = event.startTime.split(':')[0];
      return slotHour === eventHour;
    }
    return false;
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

/** Duration in grid rows (hours) for an event; minimum 1. Uses exact times when available. */
const eventSpanRows = (event: CalendarEventData): number => {
  if (event.exactStartTime && event.exactEndTime) {
    const [sh, sm] = event.exactStartTime.split(':').map(Number);
    const [eh, em] = event.exactEndTime.split(':').map(Number);
    const startM = (sh ?? 0) * 60 + (sm ?? 0);
    const endM = (eh ?? 0) * 60 + (em ?? 0);
    const durationM = endM - startM;
    if (durationM <= 0) return 1;
    return Math.max(1, Math.ceil(durationM / 60));
  }
  const startH = parseInt(event.startTime.split(':')[0], 10);
  const endH = parseInt(event.endTime.split(':')[0], 10);
  return Math.max(1, endH - startH);
};

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  weekStart,
  events,
  singleDay,
  onEventClick,
  onEventBook,
  onEventShowDetails,
  onTimeSlotClick,
  startHour = 8,
  endHour = 24,
}) => {
  const weekDates = singleDay
    ? [new Date(singleDay.getFullYear(), singleDay.getMonth(), singleDay.getDate(), 0, 0, 0, 0)]
    : getWeekDates(weekStart);
  const gridColsClass = singleDay ? 'grid-cols-[1fr_56px]' : 'grid-cols-[repeat(7,minmax(0,1fr))_56px]';

  const timeSlots = React.useMemo(() => {
    const slots = [];
    for (let i = startHour; i <= endHour; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, [startHour, endHour]);

  return (
    <div className="w-full min-h-0 flex flex-col rounded-2xl border border-gray-200" dir="rtl">
      {/* ── Day header row ── */}
      <div className={cn('grid shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 rounded-t-2xl overflow-hidden', gridColsClass)}>
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
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                {dayNumber}
              </div>
              <div
                className={cn(
                  'text-[11px] font-medium',
                  today ? 'text-[#048F86]' : 'text-gray-400'
                )}
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                {dayName}
              </div>
            </div>
          );
        })}
        {/* Time column header */}
        <div className="border-l border-gray-100 flex items-center justify-center">
          <span className="text-[10px] text-gray-300 font-medium" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>الوقت</span>
        </div>
      </div>

      {/* ── Time grid ── */}
      <div
        className={cn('grid min-h-0 flex-1 rounded-b-2xl', gridColsClass)}
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

              const perColumnFree =
                startingEvents.length > 0 && onTimeSlotClick
                  ? getPerColumnFreeSlots(time, startingEvents).filter((s) => s.toRel - s.fromRel >= 5)
                  : [];
              const fullWidthFree =
                startingEvents.length === 1 && onTimeSlotClick
                  ? getMergedFreeSubSlotsRelative(time, startingEvents).filter(([a, b]) => b - a >= 5)
                  : [];
              const freeSubSlotsToRender =
                startingEvents.length > 1
                  ? perColumnFree
                  : startingEvents.length === 1
                    ? fullWidthFree.map(([fromRel, toRel]) => ({
                        fromRel,
                        toRel,
                        columnIndex: 0,
                        columnCount: 1,
                      }))
                    : [];
              const cellRelative = startingEvents.length > 0;

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'flex flex-row gap-0.5 shrink-0 border-b border-gray-100 overflow-visible',
                    cellRelative && 'relative',
                    dayIndex < 6 && 'border-l border-gray-50',
                    today && 'bg-[#048F86]/[0.02]',
                    startingEvents.length > 0 && 'z-[1]',
                    startingEvents.length === 0 && isSlotClickable && 'cursor-pointer hover:bg-[#048F86]/[0.06] transition-colors duration-150',
                    startingEvents.length === 0 && !isSlotClickable && 'cursor-not-allowed',
                    isPast && startingEvents.length === 0 && 'opacity-40',
                  )}
                  style={{
                    gridRow: spanRows > 1 ? `${row} / span ${spanRows}` : row,
                    gridColumn: col,
                    padding: startingEvents.length > 0 ? '2px' : undefined,
                  }}
                  onClick={startingEvents.length === 0 && isSlotClickable ? () => onTimeSlotClick?.(date, time) : undefined}
                >
                  {/* Events first: wrappers pass through clicks except on the real card (pointer-events) */}
                  {startingEvents.map((event) => {
                    return (
                      <div
                        key={event.id}
                        className="min-w-0 flex-1 relative overflow-visible h-full z-[1] pointer-events-none"
                      >
                        <CalendarEvent
                          event={event}
                          slotTime={time}
                          disableHoverExpand={!!onTimeSlotClick}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          onBook={onEventBook}
                          onShowDetails={onEventShowDetails}
                        />
                      </div>
                    );
                  })}
                  {/* Per-column free bands: parallel 4–4:30 + 4–5 still leaves 4:30–5 in the short column */}
                  {freeSubSlotsToRender.map((slot, idx) => {
                    const { fromRel, toRel, columnIndex, columnCount } = slot;
                    const startTimeStr = formatMinutesToTime(parseTimeToMinutes(time) + fromRel);
                    const subPast = onTimeSlotClick != null && isSlotInPast(date, startTimeStr);
                    if (subPast) return null;
                    const topPx = (fromRel / 60) * ROW_HEIGHT_PX;
                    const hPx = ((toRel - fromRel) / 60) * ROW_HEIGHT_PX;
                    const minHitPx = 14;
                    const pct = 100 / columnCount;
                    return (
                      <button
                        key={`free-${columnIndex}-${idx}`}
                        type="button"
                        aria-label={`حجز موعد من ${startTimeStr}`}
                        className={cn(
                          'absolute z-[5] rounded-md',
                          'bg-[#048F86]/[0.08] border border-[#048F86]/20',
                          'cursor-pointer hover:bg-[#048F86]/[0.22] hover:border-[#048F86]/40',
                          'transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#048F86]/50',
                          'flex items-center justify-center text-[8px] font-bold text-[#048F86]/95',
                          'shadow-sm',
                        )}
                        style={{
                          top: Math.max(0, topPx - 1),
                          height: Math.max(hPx + 2, minHitPx),
                          padding: '0 2px',
                          fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
                          right: `${columnIndex * pct}%`,
                          width: `calc(${pct}% - 3px)`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTimeSlotClick(date, startTimeStr);
                        }}
                      >
                        + {startTimeStr}
                      </button>
                    );
                  })}
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
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
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
