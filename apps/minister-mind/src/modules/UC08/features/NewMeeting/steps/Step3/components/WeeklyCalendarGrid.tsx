import React from 'react';
import { cn } from '@sanad-ai/ui';
import { CalendarEvent, type EventType } from './CalendarEvent';

export interface CalendarEventData {
  id: string;
  type: EventType;
  label: string;
  startTime: string;
  endTime: string;
  date: Date;
  title?: string;
  description?: string;
  is_available?: boolean; // Track if slot is available for selection
  is_selected?: boolean; // Track if slot is selected by user
}

export interface WeeklyCalendarGridProps {
  weekStart: Date;
  events: CalendarEventData[];
  onEventClick?: (event: CalendarEventData) => void;
  onEventBook?: (event: CalendarEventData) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const dayNamesShort = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const monthNamesShort = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const getWeekDates = (weekStart: Date): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const getEventsForSlot = (date: Date, time: string, events: CalendarEventData[]): CalendarEventData[] => {
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return (
      eventDate.toDateString() === date.toDateString() &&
      event.startTime === time
    );
  });
};

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  weekStart,
  events,
  onEventClick,
  onEventBook,
  onTimeSlotClick,
}) => {
  const weekDates = getWeekDates(weekStart);

  return (
    <div className="w-full border-[0.6px] border-b-0 border-[#B6C1CA] rounded-[2px] overflow-hidden bg-white">
      {/* Header Row - Days */}
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b-[0.6px] border-[#B6C1CA] bg-[#FFFFFF]">
        <div className="p-3 border-[#B6C1CA] bg-[#F9FAFB]"></div>
        {weekDates.map((date, index) => {
          const dayName = dayNamesShort[date.getDay()];
          const dayNumber = date.getDate();
          const monthName = monthNamesShort[date.getMonth()];
          
          return (
            <div
              key={index}
              className="p-1 border-r-[0.6px] border-[#B6C1CA] text-right h-[50px]"
              // last:border-r-0 
            >
              <div className="text-[16px] font-bold text-[#181D25]">
                {dayNumber} 
              </div>
              <div className="text-[12px] text-[#14181F] font-weight-400" >
                {monthName}, {dayName}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Slots */}
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
        {timeSlots.map((time) => (
          <React.Fragment key={time}>
            {/* Time Label */}
            <div className="p-3 border-r-[0px] border-b-[0.6px] last:border-r-0 border-[#B6C1CA] bg-[#F9FAFB] text-right w-[60px]">
              <span className="text-[14px] font-weight-400 text-[#344054]">
                {time}
              </span>
            </div>

            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              const slotEvents = getEventsForSlot(date, time, events);
              // Check if this time slot has any available events
              const hasAvailableSlot = slotEvents.some(event => event.is_available);
              // Check if this time slot is completely blocked (all events are unavailable)
              const isBlocked = slotEvents.length > 0 && !hasAvailableSlot;
              
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "border-r-[0.6px] border-b-[0.6px] border-[#B6C1CA] h-[50px] transition-colors",
                    isBlocked ? "cursor-not-allowed bg-[#F5F5F5]" : "cursor-pointer hover:bg-[#F9FAFB]"
                  )}
                  onClick={isBlocked ? undefined : () => onTimeSlotClick?.(date, time)}
                >
                  {slotEvents.map((event) => (
                    <CalendarEvent
                      key={event.id}
                      event={event}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      onBook={onEventBook}
                    />
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
