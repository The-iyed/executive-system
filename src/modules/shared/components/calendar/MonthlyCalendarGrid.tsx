import React, { useMemo } from 'react';
import { cn } from '@/lib/ui';
import { CalendarEvent } from './CalendarEvent';
import type { CalendarEventData } from './WeeklyCalendarGrid';

export interface MonthlyCalendarGridProps {
  currentDate: Date;
  events: CalendarEventData[];
  onEventClick?: (event: CalendarEventData) => void;
  onEventShowDetails?: (event: CalendarEventData) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onDayOverflowClick?: (date: Date, events: CalendarEventData[]) => void;
}

const dayNamesShort = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isToday = (date: Date): boolean => isSameCalendarDay(date, new Date());

/** Get all calendar cells for a month view (includes leading/trailing days) */
const getMonthGrid = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startOffset = firstDay.getDay(); // 0=Sun
  const cells: Date[] = [];

  // Leading days from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push(d);
  }
  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    cells.push(new Date(year, month, i));
  }
  // Trailing days to fill 6 rows
  while (cells.length < 42) {
    const next = cells.length - startOffset - lastDay.getDate() + 1;
    cells.push(new Date(year, month + 1, next));
  }

  return cells;
};

const getEventsForDay = (date: Date, events: CalendarEventData[]): CalendarEventData[] =>
  events.filter((event) => {
    const eventDate = new Date(event.date);
    return isSameCalendarDay(eventDate, date);
  });

export const MonthlyCalendarGrid: React.FC<MonthlyCalendarGridProps> = ({
  currentDate,
  events,
  onEventClick,
  onEventShowDetails,
  onTimeSlotClick,
  onDayOverflowClick,
}) => {
  const monthDays = useMemo(() => getMonthGrid(currentDate), [currentDate]);
  const currentMonth = currentDate.getMonth();

  return (
    <div className="w-full flex flex-col rounded-2xl overflow-hidden" dir="rtl">
      {/* Day names header */}
      <div className="grid grid-cols-7 bg-white border-b border-gray-200 sticky top-0 z-10">
        {dayNamesShort.map((name, i) => (
          <div
            key={i}
            className={cn(
              'py-3 text-center text-[12px] font-semibold text-gray-500',
              i < 6 && 'border-l border-gray-100'
            )}
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 flex-1">
        {monthDays.map((date, idx) => {
          const dayEvents = getEventsForDay(date, events);
          const today = isToday(date);
          const isCurrentMonth = date.getMonth() === currentMonth;
          const row = Math.floor(idx / 7);
          const col = idx % 7;

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] border-b border-gray-100 p-1.5 transition-colors',
                col < 6 && 'border-l border-gray-100',
                !isCurrentMonth && 'bg-gray-50/50',
                isCurrentMonth && 'bg-white',
                today && 'bg-[#048F86]/[0.03]',
                dayEvents.length === 0 && 'cursor-pointer hover:bg-[#048F86]/[0.04]',
              )}
              onClick={dayEvents.length === 0 ? () => onTimeSlotClick?.(date, '09:00') : undefined}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1">
                <span
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold',
                    today ? 'bg-[#048F86] text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                  )}
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="min-w-0">
                    <CalendarEvent
                      event={event}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      onShowDetails={onEventShowDetails}
                      className="!min-h-[28px] !rounded-md"
                    />
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayOverflowClick?.(date, dayEvents);
                    }}
                    className="text-[10px] text-[#048F86] font-semibold text-center hover:underline cursor-pointer py-0.5"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                  >
                    +{dayEvents.length - 3} المزيد
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
