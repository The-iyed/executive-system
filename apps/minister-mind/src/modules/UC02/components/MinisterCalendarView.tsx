import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ScreenLoader, Drawer } from '@shared';
import {
  WeeklyCalendarNavigation,
  WeeklyCalendarGrid,
  type CalendarEventData,
} from '@shared';
import { Skeleton, cn } from '@sanad-ai/ui';
import { getOutlookTimelineEvents, type OutlookTimelineEvent } from '../data/calendarApi';

const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function formatDetailDate(date: Date): string {
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  return `${dayName} ${day} ${month}`;
}

function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

/** Monday of the given week at local midnight */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const getWeekEnd = (weekStart: Date): Date => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

const getRandomVariant = (id: string): string => {
  const variants = ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % variants.length;
  return variants[index];
};

/** Map a datetime to a grid slot string (HH:00) using local time */
const formatTimeToSlot = (date: Date, roundUp: boolean = false): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  let slotHour = roundUp && minutes > 0 ? hours + 1 : hours;
  slotHour = Math.max(0, Math.min(23, slotHour));
  return `${slotHour.toString().padStart(2, '0')}:00`;
};

const formatExactTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/** Map API attachment to calendar event attachment (no base64) */
function mapAttachments(attachments: OutlookTimelineEvent['attachments']): CalendarEventData['attachments'] {
  if (!Array.isArray(attachments)) return undefined;
  return attachments.map((a) => ({
    name: a.name,
    content_type: a.content_type,
    size: a.size,
    is_inline: a.is_inline,
    attachment_id: a.attachment_id,
  }));
}

const mapOutlookEventToCalendarEvent = (event: OutlookTimelineEvent): CalendarEventData => {
  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);
  const id = event.item_id;
  const title = event.subject || 'اجتماع';
  const variantByInternal =
    event.is_internal === true ? 'internal' : event.is_internal === false ? 'external' : getRandomVariant(id);
  if (isNaN(startDate.getTime())) {
    return {
      id,
      type: 'reserved',
      variant: variantByInternal,
      label: title,
      startTime: '08:00',
      endTime: '09:00',
      date: new Date(),
      title,
      is_available: false,
      is_internal: event.is_internal,
      location: event.location ?? undefined,
      organizer: event.organizer,
      attachments: mapAttachments(event.attachments),
    };
  }
  const startTime = formatTimeToSlot(startDate, false);
  let endTime = formatTimeToSlot(endDate, true);
  if (endTime === startTime && endDate > startDate) {
    const startHour = parseInt(startTime.split(':')[0], 10);
    endTime = `${Math.min(23, startHour + 1).toString().padStart(2, '0')}:00`;
  }
  return {
    id,
    type: 'reserved',
    variant: variantByInternal,
    label: title,
    startTime,
    endTime,
    date: startDate,
    title,
    is_available: false,
    exactStartTime: formatExactTime(startDate),
    exactEndTime: formatExactTime(endDate),
    is_internal: event.is_internal,
    location: event.location ?? undefined,
    organizer: event.organizer,
    attachments: mapAttachments(event.attachments),
  };
};

export interface MinisterCalendarViewProps {
  extraEvents?: CalendarEventData[];
  initialDate?: Date;
}

export const MinisterCalendarView: React.FC<MinisterCalendarViewProps> = ({ 
  extraEvents = [],
  initialDate
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [previousEvents, setPreviousEvents] = useState<CalendarEventData[]>([]);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<CalendarEventData | null>(null);

  // Sync currentDate if initialDate changes (e.g. when opening modal with a new selection)
  React.useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  // Format dates as ISO strings for API
  const startDateISO = useMemo(() => {
    const date = new Date(weekStart);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }, [weekStart]);

  const endDateISO = useMemo(() => {
    const date = new Date(weekEnd);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }, [weekEnd]);

  const { data: timelineEvents, isLoading, isFetching, error } = useQuery({
    queryKey: ['outlook-timeline', 'uc02', startDateISO, endDateISO],
    queryFn: () => getOutlookTimelineEvents(startDateISO, endDateISO),
    enabled: true,
  });

  // Process Outlook timeline events and merge with extraEvents
  const processedEvents = useMemo(() => {
    const mapped = (timelineEvents ?? []).map(mapOutlookEventToCalendarEvent);
    return [...mapped, ...extraEvents];
  }, [timelineEvents, extraEvents]);

  // Update previous events when we get new data
  // Use a ref to track the last event IDs to prevent infinite loops
  const lastEventIdsRef = React.useRef<string>('');
  
  React.useEffect(() => {
    if (processedEvents.length > 0 && !isFetching) {
      // Create a stable string representation of event IDs to compare
      const currentEventIds = processedEvents.map(e => e.id).sort().join(',');
      
      // Only update if the event IDs have actually changed
      if (currentEventIds !== lastEventIdsRef.current) {
        lastEventIdsRef.current = currentEventIds;
        setPreviousEvents(processedEvents);
      }
    }
  }, [processedEvents, isFetching]);

  // Use new events if available, otherwise use previous events
  const events: CalendarEventData[] = processedEvents.length > 0 
    ? processedEvents 
    : previousEvents;

  const handlePreviousWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  }, []);

  // Track if we've ever loaded data successfully
  const hasLoadedOnce = React.useRef(false);
  React.useEffect(() => {
    if (timelineEvents && !isFetching) {
      hasLoadedOnce.current = true;
    }
  }, [timelineEvents, isFetching]);

  // Show full loader only on the very first load when we've never loaded data before
  const isInitialLoad = isLoading && !hasLoadedOnce.current && previousEvents.length === 0 && !error;

  if (isInitialLoad) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center" dir="rtl">
        <ScreenLoader />
      </div>
    );
  }

  // Show error only on initial load with no previous data
  if (error && !timelineEvents && previousEvents.length === 0 && !hasLoadedOnce.current) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center text-red-600" dir="rtl">
        حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  // Calendar skeleton component for loading state
  const CalendarSkeleton = () => {
    const weekDates = useMemo(() => {
      const dates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(date);
      }
      return dates;
    }, [weekStart]);

    const timeSlots = useMemo(() => {
      const slots = [];
      for (let i = 0; i <= 23; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
      }
      return slots;
    }, []);

    // Generate some random skeleton event positions
    const skeletonEvents = useMemo(() => {
      const events: Array<{ dayIndex: number; timeIndex: number; height: number }> = [];
      // Add 3-5 skeleton events randomly
      const numEvents = 4;
      for (let i = 0; i < numEvents; i++) {
        events.push({
          dayIndex: Math.floor(Math.random() * 7),
          timeIndex: Math.floor(Math.random() * (timeSlots.length - 2)),
          height: Math.random() > 0.5 ? 2 : 1, // 1 or 2 hour blocks
        });
      }
      return events;
    }, [timeSlots.length]);

    return (
      <div className="w-full overflow-hidden bg-white" style={{ borderBottomLeftRadius: '14.5312px', borderBottomRightRadius: '14.5312px' }}>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_52px]">
          {weekDates.map((_date, index) => (
            <div
              key={index}
              className="p-2 min-h-[67px] border-b border-r flex flex-col justify-center"
              style={{ borderColor: '#EBEBEB', borderStyle: 'dashed', borderWidth: '0.908201px', background: 'rgba(255,255,255,0.6)' }}
            >
              <Skeleton className="h-4 w-6 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
          <div className="min-h-[67px] border-b border-r" style={{ borderColor: '#EBEBEB', borderStyle: 'dashed', borderWidth: '0.908201px', background: 'rgba(255,255,255,0.6)' }} />
        </div>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_52px]">
          {timeSlots.map((time, timeIndex) => (
            <React.Fragment key={time}>
              {weekDates.map((_date, dayIndex) => {
                const hasSkeletonEvent = skeletonEvents.some(
                  (e) => e.dayIndex === dayIndex && e.timeIndex === timeIndex
                );
                const skeletonEvent = skeletonEvents.find(
                  (e) => e.dayIndex === dayIndex && e.timeIndex === timeIndex
                );
                return (
                  <div
                    key={dayIndex}
                    className="min-h-[53px] border-b border-r relative"
                    style={{ borderColor: '#EAECED', borderStyle: 'dashed', borderWidth: '0.908201px' }}
                  >
                    {hasSkeletonEvent && skeletonEvent && (
                      <div
                        className="absolute inset-1 rounded-[7.58px] bg-[#F1F5F9] border border-[#D2E0EE]"
                        style={{ height: `${skeletonEvent.height * 53 - 8}px` }}
                      >
                        <Skeleton className="h-full w-full rounded-[7.58px]" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="min-h-[53px] border-b border-r" style={{ borderColor: '#EAECED', borderStyle: 'dashed', borderWidth: '0.908201px' }} />
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Always show the calendar structure - never remove it after initial load
  return (
    <div className="w-full flex flex-col relative overflow-hidden flex-1 min-h-0 gap-4" dir="rtl">
      {/* Header: Frame 2147241014 - flex row justify-end align center, padding 10px, gap 10px */}
      <div
        className="flex flex-row justify-between items-center flex-none px-[10px] pt-4 pb-4 gap-[10px] bg-white"
        style={{ borderRadius: '14px' }}
      >
        {/* Right in RTL: التقويم + subtitle + chevron-down button */}
        <div className="flex flex-row items-center gap-2">
          <button
            type="button"
            className="flex items-center justify-center w-6 h-6 rounded-[4.97024px] border border-[#D0D5DD] bg-white shadow-[0px_0.62px_1.24px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors"
            aria-label="خيارات"
          >
            <ChevronDown className="w-3 h-3 text-[#667085]" />
          </button>
          <div className="flex flex-col items-end">
            <h1
              className="font-bold text-[#101828] leading-tight"
              style={{ fontFamily: "'Almarai', sans-serif", fontSize: '15.7722px', lineHeight: '30px' }}
            >
              التقويم
            </h1>
            <p
              className="text-[#475467] leading-tight"
              style={{ fontFamily: "'Almarai', sans-serif", fontSize: '11.0405px', lineHeight: '19px' }}
            >
              عرض الجدول الزمني للاجتماعات
            </p>
          </div>
        </div>

        {/* Left in RTL: month nav with teal circles */}
        <WeeklyCalendarNavigation
          currentDate={currentDate}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
        />
      </div>

      <div className="relative flex-1 min-h-0 bg-white overflow-auto" style={{ borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
        {/* Show skeleton only on initial load when we have no data at all */}
        {isInitialLoad ? (
          <CalendarSkeleton />
        ) : (
          <>
            <WeeklyCalendarGrid
              weekStart={weekStart}
              events={events}
              startHour={8}
              endHour={18}
              onEventClick={(event) => {
                window.open(`/meeting/${event.id}`, '_blank');
              }}
              onEventShowDetails={(event) => setSelectedEventForDetails(event)}
            />
            
            {/* Subtle loading indicator when fetching new week data */}
            {isFetching && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs text-gray-700 font-medium" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                    جاري التحديث...
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error message overlay if there's an error but we have previous data */}
      {error && (timelineEvents || previousEvents.length > 0) && (
        <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-20">
          <p className="text-sm text-red-600 text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
            حدث خطأ أثناء تحديث المواعيد. يرجى المحاولة مرة أخرى.
          </p>
        </div>
      )}

      {/* Event details drawer */}
      <Drawer
        open={!!selectedEventForDetails}
        onOpenChange={(open) => !open && setSelectedEventForDetails(null)}
        title={selectedEventForDetails?.title || 'تفاصيل الموعد'}
        width={480}
        side="left"
      >
        {selectedEventForDetails && (
          <div className="flex flex-col gap-4 text-right" dir="rtl">
            <div className="flex flex-wrap items-center gap-2">
              {selectedEventForDetails.is_internal !== undefined && (
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    selectedEventForDetails.is_internal
                      ? 'bg-[#E6F6F4] text-[#008774]'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  {selectedEventForDetails.is_internal ? 'داخلي' : 'خارجي'}
                </span>
              )}
            </div>
            <p className="text-[#475467] text-sm">
              {formatDetailDate(selectedEventForDetails.date)}
            </p>
            <p className="text-[#101828] font-semibold text-sm">
              من {selectedEventForDetails.exactStartTime || selectedEventForDetails.startTime} إلى{' '}
              {selectedEventForDetails.exactEndTime || selectedEventForDetails.endTime}
            </p>
            {selectedEventForDetails.location && (
              <div>
                <h4 className="text-xs font-semibold text-[#475467] mb-1">المكان</h4>
                <p className="text-sm text-[#101828] break-all">
                  {selectedEventForDetails.location.startsWith('http')
                    ? (
                        <a
                          href={selectedEventForDetails.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0E6F90] underline"
                        >
                          {selectedEventForDetails.location}
                        </a>
                      )
                    : selectedEventForDetails.location
                  }
                </p>
              </div>
            )}
            {selectedEventForDetails.organizer && (
              <div>
                <h4 className="text-xs font-semibold text-[#475467] mb-1">المنظم</h4>
                <p className="text-sm text-[#101828]">{selectedEventForDetails.organizer.name}</p>
                <p className="text-xs text-[#475467]">{selectedEventForDetails.organizer.email}</p>
              </div>
            )}
            {selectedEventForDetails.attachments && selectedEventForDetails.attachments.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[#475467] mb-1">المرفقات</h4>
                <ul className="list-none space-y-1">
                  {selectedEventForDetails.attachments.map((att) => (
                    <li key={att.attachment_id} className="text-sm text-[#101828] flex items-center gap-2">
                      <span className="truncate flex-1" title={att.name}>{att.name}</span>
                      <span className="text-xs text-[#475467] shrink-0">{formatAttachmentSize(att.size)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
