import React, { useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Calendar, Clock, MapPin, X, Pencil, Video, Copy, ExternalLink, Settings, Check } from 'lucide-react';
import { Dialog, DialogContent, cn, Skeleton } from '@/lib/ui';
import { toast } from '@/lib/ui/components/use-toast';
import type { CalendarEventData } from '@/modules/shared';
import { getMeetingById, type MeetingApiResponse } from '@/modules/UC02/data/meetingsApi';
import { formatExactTimeFromIso, parseDateFromIso } from '../utils';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const FONT = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" } as const;
const MAX_VISIBLE_INVITEES = 5;

function formatDetailDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

function formatExactTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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

    // Parse dates without timezone conversion
    const scheduledStartDate = fromApi && meeting.scheduled_start
      ? (parseDateFromIso(meeting.scheduled_start) ?? event.date)
      : event.date;

    const startTime = fromApi && meeting.scheduled_start
      ? (formatExactTimeFromIso(meeting.scheduled_start) ?? (event.exactStartTime || event.startTime))
      : (event.exactStartTime || event.startTime);
    const endTime = fromApi && meeting.scheduled_end
      ? (formatExactTimeFromIso(meeting.scheduled_end) ?? (event.exactEndTime || event.endTime))
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

    const requiresProtocol = fromApi ? Boolean((meeting as any).requires_protocol) : false;
    const isDataComplete = fromApi ? Boolean((meeting as any).is_data_complete ?? true) : true;

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
      locationOrLink: locationText,
      isLink: typeof locationText === 'string' && locationText.startsWith('http'),
      invitees: inviteesList,
      meetingId: (fromApi ? meeting.id : undefined) ?? event.meeting_id,
      requiresProtocol,
      isDataComplete,
    };
  }, [event, meetingDetail, isLoading]);

  if (!event) return null;

  const InfoRow: React.FC<{ icon: React.ReactNode; children: React.ReactNode; border?: boolean }> = ({
    icon, children, border = true,
  }) => (
    <div className={cn('flex items-center gap-3 py-2.5', border && 'border-b border-border/20')}>
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      {children}
    </div>
  );

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[520px] w-[95vw] max-h-[85vh] p-0 rounded-2xl border border-border/60 shadow-2xl [&>button]:hidden overflow-hidden"
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
            <div className="flex items-start justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-foreground font-bold text-[16px] leading-6 truncate">{display.title}</h3>
                  {display.is_internal !== undefined && (
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit mt-0.5',
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

            {/* Body — scrollable */}
            <div className="flex flex-col px-5 pb-2 overflow-y-auto max-h-[calc(85vh-180px)] gap-4">
              {/* Details card */}
              <div className="rounded-xl border border-border/40 bg-muted/15 divide-y divide-border/20">
                {/* Organizer */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
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
                  <span className="text-[13px] font-medium text-foreground">
                    {display.startTime} – {display.endTime}
                  </span>
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
                        <>
                          <span className="text-[13px] font-medium text-foreground truncate max-w-[180px]">
                            {extractDomain(display.locationOrLink)}
                          </span>
                          <button
                            onClick={() => handleCopyLink(display.locationOrLink)}
                            className="w-6 h-6 rounded-md hover:bg-accent flex items-center justify-center transition-colors shrink-0"
                            title="نسخ الرابط"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <a
                            href={display.locationOrLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-6 h-6 rounded-md hover:bg-accent flex items-center justify-center transition-colors shrink-0"
                            title="فتح الرابط"
                          >
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </a>
                        </>
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
              </div>

              {/* Invitees */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-[13px] font-semibold text-foreground">المدعوون</span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                    {display.invitees.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {display.invitees.length > 0 ? (
                    <>
                      {display.invitees.slice(0, MAX_VISIBLE_INVITEES).map((a, idx) => (
                        <div key={`${a.name}-${idx}`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/30 bg-muted/20">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold">{getInitials(a.name || a.email || '?')}</span>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-foreground truncate">
                              {a.name || a.email || '—'}
                            </span>
                            {a.name && a.email && (
                              <span className="text-[10px] text-muted-foreground truncate">{a.email}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {display.invitees.length > MAX_VISIBLE_INVITEES && (
                        <span className="text-[11px] text-muted-foreground text-center py-1">
                          +{display.invitees.length - MAX_VISIBLE_INVITEES} آخرين
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground py-1">لا يوجد مدعوون</span>
                  )}
                </div>
              </div>

              {/* Scheduling Settings */}
              {display.meetingId && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-[13px] font-semibold text-foreground">إعدادات الجدولة</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border',
                      display.requiresProtocol
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/40 bg-muted/10'
                    )}>
                      <div className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center shrink-0',
                        display.requiresProtocol ? 'bg-primary border-primary' : 'border-border/60'
                      )}>
                        {display.requiresProtocol && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-foreground">مبدئي</span>
                        <span className="text-[10px] text-muted-foreground">يتطلب بروتوكول</span>
                      </div>
                    </div>
                    <div className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border',
                      display.isDataComplete
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/40 bg-muted/10'
                    )}>
                      <div className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center shrink-0',
                        display.isDataComplete ? 'bg-primary border-primary' : 'border-border/60'
                      )}>
                        {display.isDataComplete && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-foreground">البيانات مكتملة</span>
                        <span className="text-[10px] text-muted-foreground">جميع البيانات جاهزة</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/30 bg-muted/10">
              {display.meetingId && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(display.meetingId!)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/60 text-[12px] font-semibold text-foreground bg-background hover:bg-muted/50 transition-colors"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/60 text-[12px] font-semibold text-foreground bg-background hover:bg-muted/50 transition-colors"
              >
                عرض التفاصيل
              </button>
              {display.isLink && (
                <a
                  href={display.locationOrLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold shadow-sm transition-colors hover:bg-primary/90"
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
