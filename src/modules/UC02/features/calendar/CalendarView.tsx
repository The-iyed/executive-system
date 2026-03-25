import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn, toISOStringWithTimezone } from '@/lib/ui';
import type { CalendarEventData, CalendarViewMode } from '@/modules/shared';
import { MinisterFullCalendar } from '@/modules/UC02/components/MinisterFullCalendar';
import { CalendarSlotMeetingForm } from '@/modules/UC02/components/CalendarSlotMeetingForm';
import FormMeetingModal from '@/modules/UC02/features/MeetingForm/components/FormMeetingModal/FormMeetingModal';
import {
  createScheduledMeeting,
  updateScheduledMeeting,
  mapCreatedMeetingToOutlookEvent,
  type OutlookTimelineEvent,
} from '@/modules/UC02/data/calendarApi';
import { getMeetingById, type MeetingApiResponse } from '@/modules/UC02/data/meetingsApi';
import { trackEvent } from '@/lib/analytics';
import { useCalendarEvents, useCalendarNavigation } from './hooks';
import {
  CalendarHeader,
  CalendarSkeleton,
  EventDetailModal,
  SyncIndicator,
} from './components';
import { mapTimelineToOutlookEvent, mapTimelineToCalendarEvent, isPastEvent } from './utils';
import type { SlotSelection } from './types';

function buildOptimisticOutlookEvent(
  title: string,
  start: string,
  end: string,
  id: string,
): OutlookTimelineEvent {
  return {
    subject: title || 'اجتماع',
    start_datetime: start,
    end_datetime: end,
    item_id: id,
    change_key: 'optimistic',
    organizer: { name: '', email: '' },
    is_internal: true,
  };
}

function normalizedMeetingFromCreateResponse(
  created: Record<string, unknown>,
): MeetingApiResponse {
  return {
    ...created,
    request_number: (created.request_number as string) ?? '',
    status: (created.status as string) ?? 'SCHEDULED',
    meeting_subject: (created.meeting_title as string) ?? '',
    submitted_at: (created.submitted_at as string) ?? (created.created_at as string) ?? '',
    created_at: (created.created_at as string) ?? new Date().toISOString(),
    submitter_name: (created.submitter_name as string) ?? '',
    meeting_start_date: (created.scheduled_start as string) ?? null,
    meeting_classification: (created.meeting_classification as string) ?? 'BUSINESS',
    is_data_complete: (created.is_data_complete as boolean) ?? true,
  } as unknown as MeetingApiResponse;
}

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
  } = useCalendarNavigation(initialDate);

  const { events: timelineEvents, isLoading, isFetching, error, queryKey } = useCalendarEvents(
    currentDate,
    viewMode,
  );

  // Detail modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);

  // Slot form
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Track first load for skeleton
  const hasLoaded = useRef(false);
  if (timelineEvents.length > 0 && !isFetching) hasLoaded.current = true;

  const showSkeleton = isLoading && !hasLoaded.current;

  // Map to OutlookTimelineEvent for FullCalendar
  const outlookEvents = useMemo(
    () => timelineEvents.map(mapTimelineToOutlookEvent),
    [timelineEvents],
  );

  // Map to CalendarEventData for detail modal  
  const calendarEvents = useMemo(
    () => [...timelineEvents.map(mapTimelineToCalendarEvent), ...extraEvents],
    [timelineEvents, extraEvents],
  );

  // Sync initialDate
  React.useEffect(() => {
    if (initialDate) setCurrentDate(initialDate);
  }, [initialDate, setCurrentDate]);

  const handleEventClick = useCallback((ev: CalendarEventData) => {
    setSelectedEvent(ev);
  }, []);

  const handleSlotSelect = useCallback(
    (date: Date, time: string, endTime?: string) => {
      setSlot({ date, time, endTime, mode: 'create' });
    },
    [],
  );

  const handleEdit = useCallback(
    (ev: CalendarEventData) => {
      setSelectedEvent(null);
      const location = ev.location ?? null;
      const inferredChannel = location && /^https?:\/\//i.test(location) ? 'VIRTUAL' : 'PHYSICAL';
      const attendees = ev.attendees ?? [];
      const initialInvitees = attendees.length > 0
        ? attendees.map((a, i) => ({
            _id: `inv-edit-${i}-${Date.now()}`,
            email: a.email ?? '',
            position: a.name ?? '',
            name: a.name ?? '',
            mobile: '',
            sector: '',
            attendance_mechanism: 'PHYSICAL',
            access_permission: false,
            is_consultant: false,
            meeting_owner: false,
          }))
        : undefined;

      setSlot({
        date: ev.date,
        time: ev.exactStartTime || ev.startTime,
        endTime: ev.exactEndTime || ev.endTime || undefined,
        title: ev.meeting_title ?? ev.title ?? '',
        meetingLocation: ev.meeting_location ?? location,
        meetingChannel: ev.meeting_channel ?? inferredChannel,
        meetingLink: ev.meeting_link ?? (location && /^https?:\/\//i.test(location) ? location : null),
        meetingId: ev.meeting_id ?? undefined,
        mode: ev.meeting_id ? 'edit' : 'create',
        initialInvitees,
      });
    },
    [],
  );

  const startDateISO = useMemo(() => queryKey[1], [queryKey]);
  const endDateISO = useMemo(() => queryKey[2], [queryKey]);

  const handleSlotSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      setSlotError(null);
      setSlotSubmitting(true);
      const scheduled_start = toISOStringWithTimezone(new Date(values.start_date as string));
      const scheduled_end = toISOStringWithTimezone(new Date(values.end_date as string));
      const isEdit = slot?.mode === 'edit' && slot.meetingId;

      try {
        const invitees = ((values.invitees ?? []) as Record<string, unknown>[]).map((m) => ({
          name: (m.name ?? m.full_name ?? m.position ?? '') as string,
          position: (m.position ?? m.position_title ?? '') as string,
          mobile: (m.mobile ?? m.mobile_number ?? '') as string,
          email: (m.email ?? '') as string,
        }));

        const payload = {
          meeting_title: values.title as string,
          scheduled_start,
          scheduled_end,
          meeting_channel: values.meeting_channel as string,
          meeting_location: values.meeting_location as string | undefined,
          meeting_link: values.meeting_link as string | undefined,
          webex_meeting_unique_identifier: values.webex_meeting_unique_identifier as string | undefined,
          proposers: values.proposers as any,
          invitees,
        };

        if (isEdit) {
          await updateScheduledMeeting(slot!.meetingId!, payload);
          trackEvent('UC-02', 'uc02_meeting_updated_from_calendar', {
            meeting_id: slot!.meetingId,
            meeting_title: values.title,
          });
        } else {
          const optimisticId = `optimistic-${Date.now()}`;
          const optimisticEvent = buildOptimisticOutlookEvent(
            values.title as string,
            scheduled_start,
            scheduled_end,
            optimisticId,
          );

          queryClient.setQueryData<OutlookTimelineEvent[]>(
            ['outlook-timeline', 'uc02', startDateISO, endDateISO],
            (old) => [...(old ?? []), optimisticEvent],
          );

          const result = await createScheduledMeeting(payload);
          trackEvent('UC-02', 'uc02_meeting_created_from_calendar', {
            meeting_id: result?.id,
            meeting_title: values.title,
          });

          const eventFromApi = mapCreatedMeetingToOutlookEvent(result);
          queryClient.setQueryData<OutlookTimelineEvent[]>(
            ['outlook-timeline', 'uc02', startDateISO, endDateISO],
            (old) => (old ?? []).map((e) => (e.item_id === optimisticId ? eventFromApi : e)),
          );

          const meetingForCache = normalizedMeetingFromCreateResponse(result as unknown as Record<string, unknown>);
          queryClient.setQueryData<MeetingApiResponse>(['meeting', result.id], meetingForCache);
        }

        setSlot(null);
        if (isEdit) {
          queryClient.invalidateQueries({ queryKey: ['outlook-timeline'] });
        }
      } catch (err: unknown) {
        if (!isEdit) {
          queryClient.invalidateQueries({ queryKey: ['outlook-timeline'] });
        }
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          (isEdit ? 'حدث خطأ أثناء تحديث الاجتماع' : 'حدث خطأ أثناء إنشاء الاجتماع');
        setSlotError(message);
      } finally {
        setSlotSubmitting(false);
      }
    },
    [slot, queryClient, startDateISO, endDateISO],
  );

  return (
    <div className="w-full flex flex-col relative overflow-hidden flex-1 min-h-0 gap-4" dir="rtl">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onPrevious={goPrevious}
        onNext={goNext}
        onViewModeChange={setViewMode}
      />

      {/* Calendar body */}
      <div className="relative flex-1 min-h-0 bg-card overflow-auto rounded-2xl shadow-sm border border-border/40">
        {showSkeleton ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="relative min-h-[580px] h-[min(78vh,820px)] w-full p-3 bg-card">
              <MinisterFullCalendar
                viewMode={viewMode === 'monthly' ? 'monthly' : viewMode === 'daily' ? 'daily' : 'weekly'}
                currentDate={currentDate}
                onCurrentDateChange={viewMode === 'monthly' ? setCurrentDate : undefined}
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

      {/* Error overlay */}
      {error && !isLoading && (
        <div className="absolute top-4 left-4 right-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 z-20">
          <p className="text-sm text-destructive text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
            حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
          </p>
        </div>
      )}

      {/* Event detail modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEdit}
      />

      {/* Create/edit meeting from slot */}
      <FormMeetingModal
        open={!!slot}
        onOpenChange={(open) => !open && setSlot(null)}
      >
        {slot && (
          <CalendarSlotMeetingForm
            key={slot.meetingId ?? `create-${slot.date.getTime()}-${slot.time}-${slot.endTime ?? ''}`}
            slotDate={slot.date}
            slotTime={slot.time}
            slotEndTime={slot.endTime}
            initialTitle={slot.title ?? ''}
            initialMeetingLocation={slot.meetingLocation ?? undefined}
            initialMeetingChannel={slot.meetingChannel ?? ''}
            initialMeetingLink={slot.meetingLink ?? undefined}
            initialWebexMeetingUniqueId={slot.webexMeetingUniqueId ?? undefined}
            initialInvitees={slot.initialInvitees}
            isSubmitting={slotSubmitting}
            submitError={slotError}
            onSubmit={handleSlotSubmit as any}
            onCancel={() => {
              setSlotError(null);
              setSlot(null);
            }}
          />
        )}
      </FormMeetingModal>
    </div>
  );
};
