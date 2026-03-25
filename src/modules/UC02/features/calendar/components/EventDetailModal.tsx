import React, { useMemo, memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Calendar, Clock, MapPin, X, Pencil, Video, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, cn, Skeleton } from '@/lib/ui';
import { toast } from '@/lib/ui/components/use-toast';
import type { CalendarEventData } from '@/modules/shared';
import { getMeetingById, type MeetingApiResponse } from '@/modules/UC02/data/meetingsApi';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const FONT = { fontFamily: "'Almarai', sans-serif" } as const;
const MAX_COLLAPSED_INVITEES = 3;

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-accent/40 text-accent-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-destructive/10 text-destructive',
  'bg-muted text-muted-foreground',
];

function formatDetailDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

function formatExactTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || '?').toUpperCase();
}

type MeetingStatus = 'live' | 'soon' | 'future' | 'past';

function getMeetingStatus(start: Date, end: Date): MeetingStatus {
  const now = Date.now();
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (now >= startMs && now <= endMs) return 'live';
  if (startMs - now <= 15 * 60 * 1000 && startMs > now) return 'soon';
  if (now > endMs) return 'past';
  return 'future';
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
  const [showAllInvitees, setShowAllInvitees] = useState(false);

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

    const isLink = typeof locationText === 'string' && locationText.startsWith('http');
    const status = getMeetingStatus(scheduledStart, scheduledEnd);

    return {
      title: (fromApi ? meeting.meeting_title : event.title) || event.meeting_title || 'اجتماع',
      is_internal: event.is_internal,
      organizerName: fromApi
        ? (meeting.submitter_name || (meeting as any).submitter?.name || (meeting as any).submitter?.full_name || '')
        : (event.organizer?.name ?? ''),
      organizerEmail: fromApi
        ? ((meeting as any).submitter?.email || meeting.current_owner_user?.email || '')
        : (event.organizer?.email ?? ''),
      date: scheduledStart,
      dateLabel: `${formatDetailDate(scheduledStart)} · ${startTime} – ${endTime}`,
      startTime,
      endTime,
      locationOrLink: locationText,
      isLink,
      invitees: inviteesList,
      meetingId: event.meeting_id,
      status,
    };
  }, [event, meetingDetail, isLoading]);

  if (!event) return null;

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[480px] w-[95vw] max-h-[85vh] overflow-y-auto p-0 rounded-2xl border border-border shadow-xl [&>button]:hidden"
        dir="rtl"
      >
        {isLoading && (
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && display && (
          <div className="flex flex-col" style={FONT}>
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className="text-foreground font-bold text-[16px] leading-6 truncate">
                  {display.title}
                </h3>
                {display.is_internal !== undefined && (
                  <span className={cn(
                    'text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0',
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
                className="w-6 h-6 rounded-md bg-muted hover:bg-accent flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            {/* ── Hero Join CTA ── */}
            {display.isLink && display.status !== 'past' && (
              <div className="mx-5 mb-3">
                <a
                  href={display.locationOrLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'group relative flex items-center justify-center gap-3 w-full py-3 rounded-xl text-[14px] font-bold transition-all duration-200 active:scale-[0.98]',
                    display.status === 'live'
                      ? 'bg-[hsl(var(--primary))] text-primary-foreground shadow-lg shadow-primary/25 hover:bg-[hsl(var(--primary)/0.9)] ring-2 ring-primary/30'
                      : display.status === 'soon'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30'
                        : 'bg-primary/90 text-primary-foreground shadow-sm hover:bg-primary hover:shadow-md',
                  )}
                >
                  {/* Pulsing dot for live/soon */}
                  {(display.status === 'live' || display.status === 'soon') && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <span className={cn(
                        'w-2 h-2 rounded-full animate-pulse',
                        display.status === 'live' ? 'bg-white' : 'bg-primary-foreground/80',
                      )} />
                      <span className="text-[10px] font-medium opacity-90">
                        {display.status === 'live' ? 'جاري الآن' : 'يبدأ قريباً'}
                      </span>
                    </span>
                  )}
                  <Video className="w-[18px] h-[18px]" />
                  انضم للاجتماع
                </a>
                {/* Copy link */}
                <button
                  onClick={() => handleCopyLink(display.locationOrLink)}
                  className="flex items-center gap-1.5 mx-auto mt-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  نسخ رابط الاجتماع
                </button>
              </div>
            )}

            {/* ── Compact Metadata ── */}
            <div className="flex flex-col gap-0 px-5 py-1 border-t border-border/15">
              {/* Date + Time merged */}
              <div className="flex items-center gap-2.5 py-2 border-b border-border/10">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[12px] font-medium text-foreground">
                  {display.dateLabel}
                </span>
              </div>

              {/* Organizer */}
              {(display.organizerName || display.organizerEmail) && (
                <div className="flex items-center gap-2.5 py-2 border-b border-border/10">
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[12px] font-semibold text-foreground truncate">
                      {display.organizerName || display.organizerEmail}
                    </span>
                    {display.organizerName && display.organizerEmail && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {display.organizerEmail}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Physical location (only if NOT a link — link is handled by hero) */}
              {display.locationOrLink && !display.isLink && (
                <div className="flex items-center gap-2.5 py-2 border-b border-border/10">
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <span className="text-[12px] font-medium text-foreground truncate">
                    {display.locationOrLink}
                  </span>
                </div>
              )}
            </div>

            {/* ── Invitees ── */}
            {display.invitees.length > 0 && (
              <div className="px-5 py-2.5 border-t border-border/15">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-foreground">المدعوون</span>
                    <span className="text-[9px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {display.invitees.length}
                    </span>
                  </div>
                  {display.invitees.length > MAX_COLLAPSED_INVITEES && (
                    <button
                      onClick={() => setShowAllInvitees(prev => !prev)}
                      className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 transition-colors"
                    >
                      {showAllInvitees ? 'عرض أقل' : `+${display.invitees.length - MAX_COLLAPSED_INVITEES} آخرين`}
                      {showAllInvitees ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Avatar stack (collapsed) */}
                {!showAllInvitees && (
                  <div className="flex items-center">
                    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                      {display.invitees.slice(0, MAX_COLLAPSED_INVITEES).map((a, idx) => (
                        <div
                          key={`${a.name}-${idx}`}
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-background',
                            AVATAR_COLORS[idx % AVATAR_COLORS.length],
                          )}
                          title={a.name || a.email || '—'}
                        >
                          <span className="text-[9px] font-bold">{getInitials(a.name || a.email || '?')}</span>
                        </div>
                      ))}
                      {display.invitees.length > MAX_COLLAPSED_INVITEES && (
                        <div
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center ring-2 ring-background cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => setShowAllInvitees(true)}
                        >
                          <span className="text-[9px] font-bold text-muted-foreground">
                            +{display.invitees.length - MAX_COLLAPSED_INVITEES}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded list */}
                {showAllInvitees && (
                  <div className="flex flex-col gap-1 mt-1">
                    {display.invitees.map((a, idx) => (
                      <div key={`${a.name}-${idx}`} className="flex items-center gap-2 px-1.5 py-1 rounded-md bg-muted/40">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                          AVATAR_COLORS[idx % AVATAR_COLORS.length],
                        )}>
                          <span className="text-[8px] font-bold">{getInitials(a.name || a.email || '?')}</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {a.name || a.email || '—'}
                          </span>
                          {a.name && a.email && (
                            <span className="text-[9px] text-muted-foreground truncate">{a.email}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Footer Actions ── */}
            <div className="flex gap-2 px-5 pb-4 pt-2 border-t border-border/15">
              <button
                type="button"
                onClick={() => {
                  const id = display.meetingId ?? event.id;
                  onClose();
                  navigate(`/meeting/${id}`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-[12px] font-semibold text-foreground hover:bg-muted transition-colors"
              >
                عرض التفاصيل
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(event, meetingDetail)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-[12px] font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="w-3 h-3" />
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
