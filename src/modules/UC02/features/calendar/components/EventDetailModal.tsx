import React, { useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Calendar, Clock, MapPin, X, Pencil, Video, Copy, ExternalLink, Settings, Check, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, cn, Skeleton } from '@/lib/ui';
import { toast } from '@/lib/ui/components/use-toast';
import type { CalendarEventData } from '@/modules/shared';
import { getMeetingById, type MeetingApiResponse } from '@/modules/UC02/data/meetingsApi';
import { formatExactTimeFromIso, parseDateFromIso } from '../utils';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const FONT = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" } as const;
const MAX_VISIBLE_INVITEES = 10;

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-amber-500/15 text-amber-600',
  'bg-violet-500/15 text-violet-600',
  'bg-rose-500/15 text-rose-600',
  'bg-cyan-500/15 text-cyan-600',
];

function formatDetailDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}م`;
}

function formatExactTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function computeDurationMinutes(start: string, end: string): number | null {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (sh == null || sm == null || eh == null || em == null) return null;
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : null;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? 'ساعة' : `${h} ساعات`;
  return `${h} س ${m} د`;
}

function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.length > 30 ? host.slice(0, 27) + '...' : host;
  } catch {
    return url.length > 30 ? url.slice(0, 27) + '...' : url;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || '?').toUpperCase();
}

interface EventDetailModalProps {
  event: CalendarEventData | null;
  onClose: () => void;
  onEdit?: (meetingId: string) => void;
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

  const handleCopyLink = useCallback((link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast({ title: 'تم النسخ', description: 'تم نسخ رابط الاجتماع' });
    });
  }, []);

  const display = useMemo(() => {
    if (!event) return null;
    const meeting = meetingDetail as (MeetingApiResponse & { meeting_link?: string | null; meeting_url?: string; meeting_location?: string | null }) | undefined;
    const fromApi = meeting && !isLoading;

    const scheduledStartDate = fromApi && meeting.scheduled_start
      ? (parseDateFromIso(meeting.scheduled_start) ?? event.date)
      : event.date;

    const startTime = fromApi && meeting.scheduled_start
      ? (formatExactTimeFromIso(meeting.scheduled_start) ?? (event.exactStartTime || event.startTime))
      : (event.exactStartTime || event.startTime);
    const endTime = fromApi && meeting.scheduled_end
      ? (formatExactTimeFromIso(meeting.scheduled_end) ?? (event.exactEndTime || event.endTime))
      : (event.exactEndTime || event.endTime);

    const channel = (fromApi ? (meeting as any).meeting_channel : (event as any).meeting_channel) || '';
    const isPhysical = channel === 'PHYSICAL';

    const locationText = isPhysical
      ? ((fromApi && meeting.meeting_location) || event.meeting_location || event.location || '')
      : ((fromApi && (meeting.meeting_link ?? meeting.meeting_url ?? meeting.meeting_location)) ||
         event.meeting_link || event.meeting_location || event.location || '');

    const inviteesList = fromApi && Array.isArray(meeting.invitees) && meeting.invitees.length > 0
      ? meeting.invitees.map((inv) => {
          const row = inv as Record<string, unknown>;
          return {
            name: String(row.external_name ?? row.name ?? row.position ?? '—'),
            email: row.external_email != null || row.email != null ? String(row.external_email ?? row.email) : undefined,
          };
        })
      : (event.attendees ?? []);

    const isPreliminary = fromApi
      ? Boolean((meeting as any).is_preliminary_booking ?? false)
      : false;
    
    const isDataComplete = fromApi ? Boolean((meeting as any).is_data_complete ?? true) : true;

    const durationMin = startTime && endTime ? computeDurationMinutes(startTime, endTime) : null;

    return {
      title: (fromApi ? meeting.meeting_title : event.title) || event.meeting_title || 'اجتماع',
      is_internal: event.is_internal,
      organizerName: fromApi
        ? (meeting.submitter_name || (meeting as any).submitter?.name || (meeting as any).submitter?.full_name || '')
        : (event.organizer?.name ?? ''),
      organizerEmail: fromApi
        ? ((meeting as any).submitter?.email || meeting.current_owner_user?.email || '')
        : (event.organizer?.email ?? ''),
      date: scheduledStartDate,
      startTime,
      endTime,
      durationMin,
      locationOrLink: locationText,
      isPhysical,
      isLink: !isPhysical && typeof locationText === 'string' && locationText.startsWith('http'),
      invitees: inviteesList,
      meetingId: (fromApi ? meeting.id : undefined) ?? event.meeting_id,
      isPreliminary,
      isDataComplete,
    };
  }, [event, meetingDetail, isLoading]);

  if (!event) return null;

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[520px] w-[95vw] max-h-[85vh] p-0 rounded-2xl border border-border/60 shadow-2xl [&>button]:hidden overflow-hidden backdrop-blur-sm"
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
            <div className="flex items-start justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col min-w-0 gap-1">
                  <h3 className="text-foreground font-bold text-[16px] leading-6 break-words">{display.title}</h3>
                  {display.is_internal !== undefined && (
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit',
                      display.is_internal
                        ? 'bg-primary/10 text-primary'
                        : 'bg-amber-500/10 text-amber-600',
                    )}>
                      {display.is_internal ? 'داخلي' : 'خارجي'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-border/30" />

            {/* Body — scrollable */}
            <div className="flex flex-col px-5 py-4 overflow-y-auto max-h-[calc(85vh-180px)] gap-5">
              {/* Details card */}
              <div className="rounded-xl border border-border/40 bg-muted/10 divide-y divide-border/20 overflow-hidden">
                {/* Organizer */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">
                        {getInitials(display.organizerName || display.organizerEmail || '?')}
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold text-muted-foreground">المنظم</span>
                  </div>
                  <div className="flex flex-col items-end min-w-0">
                    <span className="text-[13px] font-semibold text-foreground truncate max-w-[260px]">
                      {display.organizerName || display.organizerEmail || '—'}
                    </span>
                    {display.organizerEmail && display.organizerName && (
                      <span className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                        {display.organizerEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] font-semibold text-muted-foreground">التاريخ</span>
                  </div>
                  <span className="text-[13px] font-medium text-foreground">
                    {formatDetailDate(display.date)}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] font-semibold text-muted-foreground">الوقت</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground" dir="ltr">
                      <span>{display.startTime}</span>
                      <span className="text-muted-foreground">–</span>
                      <span>{display.endTime}</span>
                    </span>
                    {display.durationMin && (
                      <span className="text-[10px] font-medium text-primary bg-primary/8 rounded-full px-2 py-0.5">
                        {formatDuration(display.durationMin)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Location / Link */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] font-semibold text-muted-foreground">الموقع</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {display.locationOrLink ? (
                      display.isLink ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={display.locationOrLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-[11px] font-semibold hover:bg-primary/15 transition-colors"
                          >
                            <Video className="w-3 h-3" />
                            {extractDomain(display.locationOrLink)}
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <button
                            onClick={() => handleCopyLink(display.locationOrLink)}
                            className="w-6 h-6 rounded-md hover:bg-accent flex items-center justify-center transition-colors shrink-0"
                            title="نسخ الرابط"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[13px] font-medium text-foreground truncate max-w-[260px]">
                          {display.locationOrLink}
                        </span>
                      )
                    ) : (
                      <span className="text-[13px] font-medium text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                {/* Scheduling Settings */}
                {display.meetingId && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                        <Settings className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <span className="text-[12px] font-semibold text-muted-foreground">إعدادات الجدولة</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">مبدئي:</span>
                        <span className="text-[11px] font-semibold text-foreground">
                          {display.isPreliminary ? 'نعم' : 'لا'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">البيانات مكتملة:</span>
                        <span className="text-[11px] font-semibold text-foreground">
                          {display.isDataComplete ? 'نعم' : 'لا'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Invitees */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] font-semibold text-muted-foreground">المدعوون</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {display.invitees.length}
                    </span>
                  </div>
                  {display.invitees.length > 0 ? (
                    <div className="flex flex-col divide-y divide-border/30">
                      {display.invitees.slice(0, 5).map((a, idx) => (
                        <div key={`${a.name}-${idx}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                              AVATAR_COLORS[idx % AVATAR_COLORS.length],
                            )}
                          >
                            <span className="text-[10px] font-bold">{getInitials(a.name || a.email || '?')}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold text-foreground truncate">{a.name || '—'}</span>
                            {a.email && (
                              <span className="text-[11px] text-muted-foreground truncate">{a.email}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {display.invitees.length > 5 && (
                        <div className="pt-2.5">
                          <span className="text-[11px] font-semibold text-primary">
                            +{display.invitees.length - 5} آخرين
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[12px] text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/30 bg-muted/5">
              {display.meetingId && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(display.meetingId!)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  تعديل
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const id = display.meetingId ?? event.id;
                  onClose();
                  navigate(`/meeting/${id}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/60 text-[12px] font-semibold text-foreground bg-background hover:bg-muted/50 transition-all"
              >
                عرض التفاصيل
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              {display.isLink && !display.isPhysical && (
                <a
                  href={display.locationOrLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-l from-[#048F86] via-[#069E95] to-[#0BB5AA] text-white text-[12px] font-semibold shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] hover:shadow-md"
                >
                  <Video className="w-3.5 h-3.5" />
                  انضم للاجتماع
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

EventDetailModal.displayName = 'EventDetailModal';
