import React from 'react';
import { cn } from '@sanad-ai/ui';
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
  variant?: string; // Add variant for custom coloring
  startTime: string; // Hour slot for grid positioning (e.g., "14:00")
  endTime: string; // Hour slot for grid positioning (e.g., "15:00")
  date: Date;
  title?: string;
  /** Short plain-text preview for popover (no HTML) */
  description?: string;
  is_selected?: boolean;
  is_available?: boolean;
  exactStartTime?: string;
  exactEndTime?: string;
  /** true = internal event, false = external (from Outlook timeline) */
  is_internal?: boolean;
  /** Full body (may be HTML) – for detail view only */
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
  /** Open full event details (e.g. drawer) – shown as "عرض التفاصيل" in popover */
  onEventShowDetails?: (event: CalendarEventData) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  startHour?: number;
  endHour?: number;
}

const dayNamesShort = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthNamesShort = [
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

/** Return the Monday–Sunday of the week at local midnight for reliable date comparison */
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

/** Same calendar day in local timezone */
const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Format time slot for display: "08:00" -> "08 ص", "12:00" -> "12 م", "13:00" -> "01 م" */
const formatTimeLabelArabic = (time: string): string => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 0 && hour <= 11) {
    return `${hour.toString().padStart(2, '0')} ص`;
  }
  if (hour === 12) {
    return '12 م';
  }
  return `${(hour - 12).toString().padStart(2, '0')} م`;
};

const getEventsForSlot = (slotDate: Date, time: string, events: CalendarEventData[]): CalendarEventData[] =>
  events.filter((event) => {
    const eventStart = new Date(event.date);
    if (!isSameCalendarDay(eventStart, slotDate)) {
      return false;
    }
    const timeHour = parseInt(time.split(':')[0], 10);
    const startHour = parseInt(event.startTime.split(':')[0], 10);
    const endHour = parseInt(event.endTime.split(':')[0], 10);
    if (startHour === endHour) {
      return timeHour === startHour;
    }
    return timeHour >= startHour && timeHour < endHour;
  });

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  weekStart,
  events,
  onEventClick,
  onEventBook,
  onEventShowDetails,
  onTimeSlotClick,
  startHour = 8,
  endHour = 18,
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
    <div
      className="w-full min-h-0 bg-white flex flex-col"
      style={{ borderBottomLeftRadius: '14.5312px', borderBottomRightRadius: '14.5312px' }}
      dir="rtl"
    >
      {/* Header Row: 7 days then empty corner (RTL) - sticky when scrolling */}
      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_52px] shrink-0 sticky top-0 z-10 bg-white">
        {weekDates.map((date, index) => {
          const dayName = dayNamesShort[date.getDay()];
          const dayNumber = date.getDate();
          const isFirst = index === 0;
          return (
            <div
              key={index}
              className="flex flex-col justify-center items-center py-2 px-2 text-center min-h-[67px] border-b border-r"
              style={{
                borderColor: '#EBEBEB',
                borderStyle: 'dashed',
                borderWidth: '0.908201px',
                background: 'rgba(255,255,255,0.6)',
                ...(isFirst ? { borderTopRightRadius: '14.5312px' } : {}),
              }}
            >
              <div className="font-bold text-[#272727]" style={{ fontFamily: "'Almarai', sans-serif", fontSize: '18.164px', lineHeight: '100%' }}>
                {dayNumber.toString().padStart(2, '0')}
              </div>
              <div className="text-[#272727]" style={{ fontFamily: "'Almarai', sans-serif", fontSize: '12.7148px', lineHeight: '100%' }}>
                {dayName}
              </div>
            </div>
          );
        })}
        <div
          className="border-b border-r min-h-[67px]"
          style={{ borderColor: '#EBEBEB', borderStyle: 'dashed', borderWidth: '0.908201px', background: 'rgba(255,255,255,0.6)' }}
        />
      </div>

      {/* Time Slots: 7 day columns then time column (RTL) - scrollable */}
      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_52px] min-h-0 flex-1">
        {timeSlots.map((time) => (
          <React.Fragment key={time}>
            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              const slotEvents = getEventsForSlot(date, time, events);
              const hasAvailableSlot = slotEvents.some((event) => event.is_available);
              const isBlocked = slotEvents.length > 0 && !hasAvailableSlot;

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'h-[53px] flex flex-row gap-0.5 overflow-hidden shrink-0 transition-colors border-b border-r',
                    isBlocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#F9FAFB]',
                  )}
                  style={{ borderColor: '#EAECED', borderStyle: 'dashed', borderWidth: '0.908201px' }}
                  onClick={isBlocked ? undefined : () => onTimeSlotClick?.(date, time)}
                >
                  {slotEvents.map((event) => (
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
            {/* Time Label - Almarai 12.7148px #272727 (last column = left in RTL) */}
            <div
              className="flex items-center justify-center py-2 h-[53px] shrink-0 border-b border-r"
              style={{ borderColor: '#EAECED', borderStyle: 'dashed', borderWidth: '0.908201px' }}
            >
              <span className="text-[#272727]" style={{ fontFamily: "'Almarai', sans-serif", fontSize: '12.7148px' }}>
                {formatTimeLabelArabic(time)}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

