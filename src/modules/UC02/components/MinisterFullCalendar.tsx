import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, DateSelectArg, DatesSetArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import arLocale from '@fullcalendar/core/locales/ar';
import type { CalendarEventData } from '@/modules/shared';
import type { OutlookTimelineEvent } from '../data/calendarApi';
import { cn } from '@/lib/ui';
import { ARABIC_DAY_NAMES } from '@/modules/guiding-light/lib/calendar';
import { formatDateArabic } from '@/modules/shared/utils/format';
import './minister-fullcalendar.css';

export type MinisterFcViewMode = 'daily' | 'weekly' | 'monthly';

const pad2 = (n: number) => n.toString().padStart(2, '0');

/** Same palette as CalendarEvent — pastel blocks, dark text */
const EVENT_STYLE: Record<
  string,
  { backgroundColor: string; textColor: string; borderColor: string }
> = {
  variant1: { backgroundColor: '#F0FDFA', textColor: '#115E59', borderColor: '#99F6E4' },
  variant2: { backgroundColor: '#EEF2FF', textColor: '#3730A3', borderColor: '#C7D2FE' },
  variant3: { backgroundColor: '#FFFBEB', textColor: '#92400E', borderColor: '#FDE68A' },
  variant4: { backgroundColor: '#EFF6FF', textColor: '#1E40AF', borderColor: '#BFDBFE' },
  variant5: { backgroundColor: '#F5F3FF', textColor: '#5B21B6', borderColor: '#DDD6FE' },
  variant6: { backgroundColor: '#ECFEFF', textColor: '#155E75', borderColor: '#A5F3FC' },
  internal: { backgroundColor: '#F0FDFA', textColor: '#115E59', borderColor: '#99F6E4' },
  external: { backgroundColor: '#FFFBEB', textColor: '#92400E', borderColor: '#FDE68A' },
};

function variantFromId(id: string): string {
  const variants = ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return variants[Math.abs(hash) % variants.length]!;
}

function styleForOutlook(e: OutlookTimelineEvent): { backgroundColor: string; textColor: string; borderColor: string } {
  const v = variantFromId(e.item_id);
  return EVENT_STYLE[v] ?? EVENT_STYLE.variant1!;
}

/** Parse ISO string without timezone conversion */
function parseIsoLocal(iso: string): { date: Date; hour: number; minute: number; year: number; month: number; day: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), hour: Number(m[4]), minute: Number(m[5]), year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** Build an offset-free ISO string that FullCalendar will treat as-is (no tz shift) */
function toNaiveISO(p: { year: number; month: number; day: number; hour: number; minute: number }): string {
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}:00`;
}

type TimelineEventWithFixedTimes = OutlookTimelineEvent & {
  meeting_start_date?: string | null;
  meeting_end_date?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
};

function resolveTimelineEventTimes(event: OutlookTimelineEvent): { startISO: string; endISO: string } {
  const raw = event as TimelineEventWithFixedTimes;
  return {
    startISO: raw.meeting_start_date ?? raw.scheduled_start ?? event.start_datetime,
    endISO: raw.meeting_end_date ?? raw.scheduled_end ?? event.end_datetime,
  };
}

/** Build CalendarEventData using raw ISO time (no timezone conversion). */
export function outlookEventToCalendarDetail(event: OutlookTimelineEvent): CalendarEventData {
  const { startISO, endISO } = resolveTimelineEventTimes(event);
  const parsedStart = parseIsoLocal(startISO);
  const parsedEnd = parseIsoLocal(endISO);
  const id = event.item_id;
  const title = event.subject || 'اجتماع';
  if (!parsedStart) {
    return {
      id,
      type: 'reserved',
      variant: 'variant1',
      label: title,
      title,
      startTime: '08:00',
      endTime: '09:00',
      date: new Date(),
      is_available: false,
      is_internal: event.is_internal,
    };
  }
  const exactStart = `${pad2(parsedStart.hour)}:${pad2(parsedStart.minute)}`;
  const exactEnd = parsedEnd ? `${pad2(parsedEnd.hour)}:${pad2(parsedEnd.minute)}` : exactStart;
  let startHour = parsedStart.hour;
  let endHour = parsedEnd?.hour ?? startHour + 1;
  const endMin = parsedEnd?.minute ?? 0;
  if (endMin > 0) endHour = Math.min(23, endHour + 1);
  if (endHour <= startHour) endHour = Math.min(23, startHour + 1);
  const variant = variantFromId(id);
  return {
    id,
    type: 'reserved',
    variant,
    label: title,
    title,
    is_available: false,
    is_internal: event.is_internal,
    location: event.location ?? undefined,
    organizer: event.organizer,
    attachments: Array.isArray(event.attachments)
      ? event.attachments.map((a) => ({
          name: a.name,
          content_type: a.content_type,
          size: a.size,
          is_inline: a.is_inline,
          attachment_id: a.attachment_id,
        }))
      : undefined,
    attendees: event.attendees ?? null,
    meeting_id: event.meeting_id ?? undefined,
    meeting_title: event.meeting_title ?? undefined,
    meeting_channel: event.meeting_channel ?? undefined,
    meeting_location: event.meeting_location ?? undefined,
    meeting_link: event.meeting_link ?? undefined,
    startTime: `${pad2(startHour)}:00`,
    endTime: `${pad2(endHour)}:00`,
    date: parsedStart.date,
    exactStartTime: exactStart,
    exactEndTime: exactEnd,
  };
}

function extraEventToDetail(ev: CalendarEventData): CalendarEventData {
  const d = new Date(ev.date);
  const [sh, sm] = (ev.exactStartTime || ev.startTime).split(':').map(Number);
  const [eh, em] = (ev.exactEndTime || ev.endTime).split(':').map(Number);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh || 0, sm || 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh || 0, em || 0, 0, 0);
  if (end <= start) end.setHours(start.getHours() + 1);
  return {
    ...ev,
    date: d,
    exactStartTime: ev.exactStartTime || `${pad2(sh)}:${pad2(sm ?? 0)}`,
    exactEndTime: ev.exactEndTime || `${pad2(eh)}:${pad2(em ?? 0)}`,
  };
}

function openSlotFromDate(clicked: Date, allDay: boolean): { day: Date; time: string } | null {
  const now = Date.now();
  const day = new Date(clicked.getFullYear(), clicked.getMonth(), clicked.getDate(), 0, 0, 0, 0);
  if (allDay) {
    const slot = new Date(day);
    slot.setHours(9, 0, 0, 0);
    if (slot.getTime() < now - 60000) return null;
    return { day, time: '09:00' };
  }
  if (clicked.getTime() < now - 60000) return null;
  return {
    day,
    time: `${pad2(clicked.getHours())}:${pad2(clicked.getMinutes())}`,
  };
}

export interface MinisterFullCalendarProps {
  viewMode: MinisterFcViewMode;
  currentDate: Date;
  onCurrentDateChange?: (d: Date) => void;
  outlookEvents: OutlookTimelineEvent[];
  extraEvents: CalendarEventData[];
  onEventClick: (ev: CalendarEventData) => void;
  /** endHHmm omitted → form defaults (e.g. single click). Pass end from drag selection. */
  onTimeSlotSelect: (date: Date, startHHmm: string, endHHmm?: string) => void;
  className?: string;
}

export const MinisterFullCalendar: React.FC<MinisterFullCalendarProps> = ({
  viewMode,
  currentDate,
  onCurrentDateChange,
  outlookEvents,
  extraEvents,
  onEventClick,
  onTimeSlotSelect,
  className,
}) => {
  const apiRef = useRef<FullCalendar | null>(null);

  const initialView =
    viewMode === 'monthly' ? 'dayGridMonth' : viewMode === 'daily' ? 'timeGridDay' : 'timeGridWeek';

  const fcEvents = useMemo(() => {
    const out: {
      id: string;
      title: string;
      start: string;
      end: string;
      backgroundColor: string;
      textColor: string;
      borderColor: string;
      extendedProps: { detail: CalendarEventData };
    }[] = [];
    for (const e of outlookEvents) {
      const { startISO, endISO } = resolveTimelineEventTimes(e);
      const parsedS = parseIsoLocal(startISO);
      const parsedE = parseIsoLocal(endISO);
      if (!parsedS) continue;
      const start = toNaiveISO(parsedS);
      let end: string;
      if (parsedE) {
        end = toNaiveISO(parsedE);
        if (end <= start) {
          end = toNaiveISO({ ...parsedS, hour: Math.min(23, parsedS.hour + 1), minute: parsedS.minute });
        }
      } else {
        end = toNaiveISO({ ...parsedS, hour: Math.min(23, parsedS.hour + 1), minute: parsedS.minute });
      }
      const sty = styleForOutlook(e);
      const detailSource: OutlookTimelineEvent =
        startISO === e.start_datetime && endISO === e.end_datetime
          ? e
          : { ...e, start_datetime: startISO, end_datetime: endISO };
      out.push({
        id: e.item_id,
        title: e.subject || 'اجتماع',
        start,
        end,
        backgroundColor: sty.backgroundColor,
        textColor: sty.textColor,
        borderColor: sty.borderColor,
        extendedProps: { detail: outlookEventToCalendarDetail(detailSource) },
      });
    }
    for (const ev of extraEvents) {
      const detail = extraEventToDetail(ev);
      const d = new Date(detail.date);
      const [sh, sm] = (detail.exactStartTime || detail.startTime).split(':').map(Number);
      const [eh, em] = (detail.exactEndTime || detail.endTime).split(':').map(Number);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const start = toNaiveISO({ year, month, day, hour: sh || 0, minute: sm || 0 });
      let end = toNaiveISO({ year, month, day, hour: eh || 0, minute: em || 0 });
      if (end <= start) end = toNaiveISO({ year, month, day, hour: Math.min(23, (sh || 0) + 1), minute: sm || 0 });
      const v = detail.variant && EVENT_STYLE[detail.variant] ? detail.variant : variantFromId(ev.id);
      const sty = EVENT_STYLE[v] ?? EVENT_STYLE.variant1!;
      out.push({
        id: ev.id,
        title: ev.label || ev.title || 'حدث',
        start,
        end,
        backgroundColor: sty.backgroundColor,
        textColor: sty.textColor,
        borderColor: sty.borderColor,
        extendedProps: { detail },
      });
    }
    return out;
  }, [outlookEvents, extraEvents]);

  useEffect(() => {
    const api = apiRef.current?.getApi();
    if (!api) return;
    const view =
      viewMode === 'monthly' ? 'dayGridMonth' : viewMode === 'daily' ? 'timeGridDay' : 'timeGridWeek';
    if (api.view.type !== view) api.changeView(view);
    api.gotoDate(currentDate);
    // Re-sync event source after view jumps (FC sometimes stale after changeView)
    api.refetchEvents();
  }, [viewMode, currentDate]);

  const onDatesSet = (arg: DatesSetArg) => {
    if (onCurrentDateChange && arg.view.type === 'dayGridMonth') {
      onCurrentDateChange(arg.view.currentStart);
    }
  };

  const handleEventClick = (arg: EventClickArg) => {
    arg.jsEvent.preventDefault();
    arg.jsEvent.stopPropagation();
    const detail = arg.event.extendedProps.detail as CalendarEventData | undefined;
    if (detail) onEventClick(detail);
  };

  const fireSlot = useCallback(
    (day: Date, start: string, end?: string) => {
      onTimeSlotSelect(day, start, end);
    },
    [onTimeSlotSelect]
  );

  /** Single click — default 30 min block (matches slot duration). */
  const handleDateClick = (arg: any) => {
    const slot = openSlotFromDate(arg.date, arg.allDay);
    if (!slot) return;
    const [h, m] = slot.time.split(':').map(Number);
    const endD = new Date(slot.day);
    endD.setHours(h || 0, (m || 0) + 30, 0, 0);
    const endTime = `${pad2(endD.getHours())}:${pad2(endD.getMinutes())}`;
    fireSlot(slot.day, slot.time, endTime);
  };

  /** Drag selection — use real end time (e.g. 7:00–7:30). */
  const handleSelect = (arg: DateSelectArg) => {
    arg.view.calendar.unselect();
    const slot = openSlotFromDate(arg.start, false);
    if (!slot) return;
    let end = arg.end;
    if (end.getTime() <= arg.start.getTime()) {
      end = new Date(arg.start.getTime() + 30 * 60 * 1000);
    }
    const endTime = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
    fireSlot(slot.day, slot.time, endTime);
  };

  return (
    <div
      className={cn(
        'minister-fc fc-direction-rtl min-h-[560px] w-full rounded-2xl',
        className
      )}
      dir="rtl"
    >
      <FullCalendar
        key={viewMode}
        ref={apiRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        initialDate={currentDate}
        locale={arLocale}
        direction="rtl"
        firstDay={0}
        headerToolbar={false}
        height="auto"
        contentHeight="auto"
        timeZone="UTC"
        events={fcEvents}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        selectable
        selectAllow={(selectInfo) => selectInfo.start.getTime() >= Date.now() - 60000}
        selectMirror
        selectMinDistance={0}
        longPressDelay={0}
        unselectAuto
        select={handleSelect}
        datesSet={onDatesSet}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        nowIndicator
        dayMaxEvents={4}
        moreLinkClick="popover"
        eventDisplay="block"
        slotDuration="00:30:00"
        snapDuration="00:15:00"
        slotLabelInterval="01:00:00"
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        buttonText={{ today: 'اليوم' }}
        dayHeaderContent={(arg) => {
          if (viewMode === 'daily') {
            const d = arg.date;
            const dayName = ARABIC_DAY_NAMES[d.getDay()];
            const formatted = formatDateArabic(d);
            return { html: `<span>${dayName} ${formatted}</span>` };
          }
          return arg.text;
        }}
      />
    </div>
  );
};
