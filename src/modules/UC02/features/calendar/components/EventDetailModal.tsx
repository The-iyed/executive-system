import React, { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Calendar, Clock, MapPin, X, Pencil } from 'lucide-react';
import { Dialog, DialogContent, cn, Skeleton } from '@/lib/ui';
import type { CalendarEventData } from '@/modules/shared';
import { getMeetingById, type MeetingApiResponse } from '@/modules/UC02/data/meetingsApi';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const FONT = { fontFamily: "'Almarai', sans-serif" } as const;

function formatDetailDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

function formatExactTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

interface EventDetailModalProps {
  event: CalendarEventData | null;
  onClose: () => void;
  onEdit?: (event: CalendarEventData, meetingDetail?: MeetingApiResponse) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = memo(({
  event,
  onClose,
  onEdit,
}) => {
  const navigate = useNavigate();

  const isOptimistic = event?.id?.startsWith('optimistic-');
  const isOutlookId = event?.id?.startsWith('AAMk');
  const meetingIdToFetch =
    event?.meeting_id ??
    (event?.id && !isOptimistic && !isOutlookId ? event.id : undefined);

  const { data: meetingDetail, isLoading } = useQuery({
    queryKey: ['meeting', meetingIdToFetch],
    queryFn: () => getMeetingById(meetingIdToFetch!),
    enabled: !!meetingIdToFetch,
  });

  const display = useMemo(() => {
    if (!event) return null;
    const meeting = meetingDetail as (MeetingApiResponse & { meeting_link?: string | null; meeting_url?: string; meeting_location?: string | null }) | undefined;
    const fromApi = meeting && !isLoading;
    const scheduledStart = fromApi && meeting.scheduled_start ? new Date(meeting.scheduled_start) : event.date;
    const scheduledEnd = fromApi && meeting.scheduled_end ? new Date(meeting.scheduled_end) : event.date;

    const startTime = fromApi && meeting.scheduled_start
      ? formatExactTime(scheduledStart)
      : (event.exactStartTime || event.startTime);
    const endTime = fromApi && meeting.scheduled_end
      ? formatExactTime(scheduledEnd)
      : (event.exactEndTime || event.endTime);

    const locationText =
      (fromApi && (meeting.meeting_link ?? meeting.meeting_url ?? meeting.meeting_location)) ||
      event.meeting_link || event.meeting_location || event.location || '';

    const inviteesList = fromApi && Array.isArray(meeting.invitees) && meeting.invitees.length > 0
      ? meeting.invitees.map((inv) => {
          const row = inv as Record<string, unknown>;
          return {
            name: String(row.external_name ?? row.name ?? row.position ?? '—'),
            email: row.external_email != null || row.email != null ? String(row.external_email ?? row.email) : undefined,
          };
        })
      : (event.attendees ?? []);

    return {
      title: (fromApi ? meeting.meeting_title : event.title) || event.meeting_title || 'اجتماع',
      is_internal: event.is_internal,
      organizerName: fromApi ? meeting.submitter_name : event.organizer?.name ?? '',
      organizerEmail: fromApi ? (meeting.current_owner_user?.email ?? '') : (event.organizer?.email ?? ''),
      date: scheduledStart,
      startTime,
      endTime,
      locationOrLink: locationText,
      invitees: inviteesList,
      meetingId: event.meeting_id,
    };
  }, [event, meetingDetail, isLoading]);

  if (!event) return null;

  const InfoRow: React.FC<{ icon: React.ReactNode; children: React.ReactNode; border?: boolean }> = ({
    icon, children, border = true,
  }) => (
    <div className={cn('flex items-center gap-3 py-3.5', border && 'border-b border-border/30')}>
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      {children}
    </div>
  );

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[860px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-border shadow-xl [&>button]:hidden"
        dir="rtl"
      >
        {isLoading && (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && display && (
          <div className="flex flex-col" style={FONT}>
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border/30">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <h3 className="text-foreground font-bold text-[16px] leading-6">{display.title}</h3>
                {display.is_internal !== undefined && (
                  <span className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded w-fit',
                    display.is_internal
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {display.is_internal ? 'داخلي' : 'خارجي'}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors shrink-0 mr-3"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col px-6 py-2">
              <InfoRow icon={<User className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-foreground truncate w-full">
                    {display.organizerName || '—'}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate w-full">
                    {display.organizerEmail || '—'}
                  </span>
                </div>
              </InfoRow>

              <InfoRow icon={<Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}>
                <span className="text-[13px] font-medium text-foreground">
                  {formatDetailDate(display.date)}
                </span>
              </InfoRow>

              <InfoRow icon={<Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}>
                <span className="text-[13px] font-medium text-foreground">
                  {display.startTime} – {display.endTime}
                </span>
              </InfoRow>

              <InfoRow icon={<MapPin className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}>
                <div className="flex-1 min-w-0">
                  {display.locationOrLink ? (
                    display.locationOrLink.startsWith('http') ? (
                      <a
                        href={display.locationOrLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-medium text-primary underline underline-offset-2 truncate block"
                      >
                        {display.locationOrLink}
                      </a>
                    ) : (
                      <span className="text-[13px] font-medium text-foreground truncate block">
                        {display.locationOrLink}
                      </span>
                    )
                  ) : (
                    <span className="text-[13px] font-medium text-muted-foreground">—</span>
                  )}
                </div>
              </InfoRow>

              {/* Invitees */}
              <div className="flex flex-col gap-2 py-3.5 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <span className="text-[13px] font-semibold text-foreground">قائمة المدعوين</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {display.invitees.length} مدعو
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                  {display.invitees.length > 0 ? (
                    display.invitees.map((a, idx) => (
                      <div key={`${a.name}-${idx}`} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/60">
                        <span className="text-[13px] font-medium text-foreground truncate">{a.name || '—'}</span>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {a.email || '—'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[12px] text-muted-foreground py-1">لا يوجد مدعوون</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full justify-end gap-2 flex-wrap px-6 pb-5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const id = display.meetingId ?? event.id;
                  onClose();
                  navigate(`/meeting/${id}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold transition-colors hover:bg-primary/90"
              >
                عرض التفاصيل
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(event, meetingDetail)}
                  className="inline-flex max-w-[130px] items-center gap-1.5 px-3 py-3.5 rounded-lg border border-primary/30 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  تعديل
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

EventDetailModal.displayName = 'EventDetailModal';
