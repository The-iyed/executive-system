import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toISOStringWithTimezone } from '@/lib/ui';
import type { CalendarEventData } from '@/modules/shared';
import { MeetingOwnerType } from '@/modules/shared';
import { MinisterFullCalendar } from '@/modules/UC02/components/MinisterFullCalendar';
import { CalendarSlotMeetingForm } from '@/modules/UC02/components/CalendarSlotMeetingForm';
import { SubmitterModal } from '@/modules/shared/features/meeting-request-form';

import {
  createScheduledMeeting,
  updateScheduledMeeting,
} from '@/modules/UC02/data/calendarApi';
import { type MeetingApiResponse } from '@/modules/UC02/data/meetingsApi';
import type { CalendarTimelineEvent } from '@/api/meetings/getMeetingsTimeline';
import { trackEvent } from '@/lib/analytics';
import { useCalendarEvents, useCalendarNavigation } from './hooks';
import {
  CalendarHeader,
  CalendarSkeleton,
  EventDetailModal,
  SyncIndicator,
} from './components';
import { mapTimelineToOutlookEvent, mapTimelineToCalendarEvent } from './utils';
import type { SlotSelection } from './types';

/** Build optimistic CalendarTimelineEvent for immediate cache update */
function buildOptimisticEvent(
  title: string,
  start: string,
  end: string,
  id: string,
): CalendarTimelineEvent {
  return {
    id,
    title: title || 'اجتماع',
    start,
    end,
    location: null,
    organizer: '',
    organizerEmail: '',
    isInternal: true,
    attendees: [],
    meetingId: null,
    meetingTitle: null,
    meetingChannel: null,
    meetingLocation: null,
    meetingLink: null,
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
    goToday,
  } = useCalendarNavigation(initialDate);

  const { events: timelineEvents, isLoading, isFetching, error, queryKey } = useCalendarEvents(
    currentDate,
    viewMode,
  );

  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [editMeetingId, setEditMeetingId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  const showSkeleton = isLoading;

  // Map to OutlookTimelineEvent for MinisterFullCalendar compatibility
  const outlookEvents = useMemo(
    () => timelineEvents.map(mapTimelineToOutlookEvent),
    [timelineEvents],
  );

  // Map to CalendarEventData for detail modal
  const calendarEvents = useMemo(
    () => [...timelineEvents.map(mapTimelineToCalendarEvent), ...extraEvents],
    [timelineEvents, extraEvents],
  );

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


  const handleSlotSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      setSlotError(null);
      setSlotSubmitting(true);
      const scheduled_start = toISOStringWithTimezone(new Date(values.start_date as string));
      const scheduled_end = toISOStringWithTimezone(new Date(values.end_date as string));
      const isEdit = slot?.mode === 'edit' && slot.meetingId;

      // Snapshot for rollback
      const previousEvents = queryClient.getQueryData<CalendarTimelineEvent[]>([...queryKey]);

      try {
        const invitees = ((values.invitees ?? []) as Record<string, unknown>[]).map((m) => ({
          name: (m.name ?? m.full_name ?? '') as string,
          position: (m.position ?? m.position_title ?? '') as string,
          mobile: (m.mobile ?? m.mobile_number ?? '') as string,
          email: (m.email ?? '') as string,
          sector: (m.sector ?? '') as string,
          attendance_mechanism: (m.attendance_mechanism ?? '') as string,
          access_permission: Boolean(m.access_permission),
          is_consultant: Boolean(m.is_consultant),
          meeting_owner: Boolean(m.meeting_owner),
          ...(m.object_guid ? { object_guid: m.object_guid as string } : {}),
        }));

        const payload = {
          meeting_title: values.title as string,
          scheduled_start,
          scheduled_end,
          meeting_channel: values.meeting_channel as string,
          meeting_location: values.meeting_location as string | undefined,
          meeting_link: values.meeting_link as string | undefined,
          webex_meeting_unique_identifier: values.webex_meeting_unique_identifier as string | undefined,
          proposers: values.proposers as unknown,
          invitees,
        };

        if (isEdit) {
          // Optimistically update the edited event in cache
          queryClient.setQueryData<CalendarTimelineEvent[]>(
            [...queryKey],
            (old) => (old ?? []).map((e) =>
              e.meetingId === slot!.meetingId
                ? {
                    ...e,
                    title: (values.title as string) || e.title,
                    start: scheduled_start,
                    end: scheduled_end,
                    meetingTitle: (values.title as string) || e.meetingTitle,
                    meetingChannel: (values.meeting_channel as string) || e.meetingChannel,
                    meetingLocation: (values.meeting_location as string) || e.meetingLocation,
                    meetingLink: (values.meeting_link as string) || e.meetingLink,
                    location: (values.meeting_location as string) || e.location,
                  }
                : e
            ),
          );

          await updateScheduledMeeting(slot!.meetingId!, payload as any);
          trackEvent('UC-02', 'uc02_meeting_updated_from_calendar', {
            meeting_id: slot!.meetingId,
            meeting_title: values.title,
          });

          // Close modal only after successful API response
          setSlot(null);

          // Background sync
          queryClient.invalidateQueries({ queryKey: ['calendar-timeline'] });
        } else {
          const result = await createScheduledMeeting(payload as any);
          trackEvent('UC-02', 'uc02_meeting_created_from_calendar', {
            meeting_id: result?.id,
            meeting_title: values.title,
          });

          // Close modal only after successful API response
          setSlot(null);

          // Insert real event into cache (optimistic update with real data)
          const realEvent: CalendarTimelineEvent = {
            id: result.id ?? `created-${Date.now()}`,
            title: result.meeting_title ?? (values.title as string) ?? 'اجتماع',
            start: result.scheduled_start ?? scheduled_start,
            end: result.scheduled_end ?? scheduled_end,
            location: result.meeting_location ?? null,
            organizer: '',
            organizerEmail: '',
            isInternal: true,
            attendees: [],
            meetingId: result.id ?? null,
            meetingTitle: result.meeting_title ?? null,
            meetingChannel: result.meeting_channel ?? null,
            meetingLocation: result.meeting_location ?? null,
            meetingLink: result.meeting_link ?? null,
          };

          queryClient.setQueryData<CalendarTimelineEvent[]>(
            [...queryKey],
            (old) => [...(old ?? []), realEvent],
          );

          const meetingForCache = normalizedMeetingFromCreateResponse(result as unknown as Record<string, unknown>);
          queryClient.setQueryData<MeetingApiResponse>(['meeting', result.id], meetingForCache);
        }
      } catch (err: unknown) {
        // Rollback cache to previous state
        if (previousEvents) {
          queryClient.setQueryData<CalendarTimelineEvent[]>([...queryKey], previousEvents);
        } else {
          queryClient.invalidateQueries({ queryKey: ['calendar-timeline'] });
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
    [slot, queryClient, queryKey],
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
          <p className="text-sm text-destructive text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
            حدث خطأ أثناء تحميل المواعيد. يرجى المحاولة مرة أخرى.
          </p>
        </div>
      )}

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(meetingId) => {
          setSelectedEvent(null);
          setEditMeetingId(meetingId);
        }}
      />

      <SubmitterModal
        callerRole={MeetingOwnerType.SCHEDULING}
        open={!!editMeetingId}
        onOpenChange={(open) => { if (!open) setEditMeetingId(null); }}
        editMeetingId={editMeetingId ?? undefined}
        showAiSuggest
      />

      {slot && (
        <CalendarSlotMeetingForm
          key={slot.meetingId ?? `create-${slot.date.getTime()}-${slot.time}-${slot.endTime ?? ''}`}
          open={!!slot}
          onOpenChange={(open) => !open && setSlot(null)}
          slotDate={slot.date}
          slotTime={slot.time}
          slotEndTime={slot.endTime}
          initialTitle={slot.title ?? ''}
          initialMeetingLocation={slot.meetingLocation ?? undefined}
          initialMeetingChannel={slot.meetingChannel ?? ''}
          initialInvitees={slot.initialInvitees}
          mode={slot.mode}
          isSubmitting={slotSubmitting}
          submitError={slotError}
          onSubmit={handleSlotSubmit as any}
          onCancel={() => {
            setSlotError(null);
            setSlot(null);
          }}
        />
      )}
    </div>
  );
};
