import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toISOStringWithTimezone } from '@/lib/ui';
import type { CalendarEventData } from '@/modules/shared';
import { MinisterFullCalendar } from '@/modules/UC02/components/MinisterFullCalendar';
import { SchedulerModal } from '@/modules/shared/features/meeting-request-form/scheduler';
import type { SchedulerStep1Values } from '@/modules/shared/features/meeting-request-form/scheduler/schema';
import { AttendanceMechanism } from '@/modules/shared/features/meeting-request-form/shared/types/enums';
import { trackEvent } from '@/lib/analytics';
import { useCalendarEvents, useCalendarNavigation } from './hooks';
import {
  CalendarHeader,
  CalendarSkeleton,
  EventDetailModal,
  SyncIndicator,
} from './components';
import { mapTimelineToOutlookEvent, mapTimelineToCalendarEvent } from './utils';

export interface CalendarViewProps {
  extraEvents?: CalendarEventData[];
  initialDate?: Date;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  extraEvents = [],
  initialDate,
}) => {
  const queryClient = useQueryClient();
  const {
    currentDate,
    viewMode,
    setCurrentDate,
    setViewMode,
    goNext,
    goPrevious,
    goToday,
  } = useCalendarNavigation(initialDate);

  const { events: timelineEvents, isLoading, isFetching, error } = useCalendarEvents(
    currentDate,
    viewMode,
  );

  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerInitialValues, setSchedulerInitialValues] = useState<Partial<SchedulerStep1Values> | undefined>();

  const showSkeleton = isLoading;

  const outlookEvents = useMemo(
    () => timelineEvents.map(mapTimelineToOutlookEvent),
    [timelineEvents],
  );

  React.useEffect(() => {
    if (initialDate) setCurrentDate(initialDate);
  }, [initialDate, setCurrentDate]);

  const handleEventClick = useCallback((ev: CalendarEventData) => {
    setSelectedEvent(ev);
  }, []);

  const handleSlotSelect = useCallback(
    (date: Date, time: string, endTime?: string) => {
      const [h = 0, m = 0] = time.split(':').map(Number);
      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
      const startISO = toISOStringWithTimezone(startDate);

      let endISO: string;
      if (endTime) {
        const [eh = 0, em = 0] = endTime.split(':').map(Number);
        const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eh, em, 0, 0);
        endISO = toISOStringWithTimezone(endDate);
      } else {
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        endISO = toISOStringWithTimezone(endDate);
      }

      setSchedulerInitialValues({
        meeting_start_date: startISO,
        meeting_end_date: endISO,
        meeting_channel: AttendanceMechanism.PHYSICAL,
      });
      setSchedulerOpen(true);
    },
    [],
  );

  const handleSchedulerSuccess = useCallback(
    (result: { meetingId: string; scheduled: boolean }) => {
      trackEvent('UC-02', 'uc02_meeting_created_from_calendar', {
        meeting_id: result.meetingId,
        scheduled: result.scheduled,
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-timeline'] });
    },
    [queryClient],
  );

  const handleSchedulerOpenChange = useCallback(
    (open: boolean) => {
      setSchedulerOpen(open);
      if (!open) {
        setSchedulerInitialValues(undefined);
      }
    },
    [],
  );

  return (
    <div className="w-full flex flex-col relative overflow-hidden flex-1 min-h-0 gap-4" dir="rtl">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onPrevious={goPrevious}
        onNext={goNext}
        onToday={goToday}
        onDateSelect={setCurrentDate}
        onViewModeChange={setViewMode}
      />

      <div className="relative flex-1 min-h-0 bg-card overflow-auto rounded-2xl shadow-sm border border-border/40">
        {showSkeleton ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="relative min-h-[580px] h-[min(78vh,820px)] w-full p-3 bg-card">
              <MinisterFullCalendar
                viewMode={viewMode === 'monthly' ? 'monthly' : viewMode === 'daily' ? 'daily' : 'weekly'}
                currentDate={currentDate}
                onCurrentDateChange={undefined}
                outlookEvents={outlookEvents}
                extraEvents={extraEvents}
                onEventClick={handleEventClick}
                onTimeSlotSelect={handleSlotSelect}
              />
            </div>
            {isFetching && <SyncIndicator />}
          </>
        )}
      </div>

      {error && !isLoading && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          <p className="text-sm text-destructive text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
            حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
          </p>
        </div>
      )}

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <SchedulerModal
        open={schedulerOpen}
        onOpenChange={handleSchedulerOpenChange}
        initialStep1Values={schedulerInitialValues}
        onSuccess={handleSchedulerSuccess}
      />
    </div>
  );
};
