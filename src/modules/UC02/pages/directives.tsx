import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import {
  CalendarDays, Clock, FileText, Copy, Check, ScrollText,
  CheckCircle2, AlertTriangle, Zap, Volume2, XCircle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/ui';
import { listDirectives, type MinisterDirective } from '@/modules/UC19/api/directivesApi';
import { takeDirective, requestMeetingFromDirective } from '../data/meetingsApi';
import {
  DIRECTIVE_STATUS_LABELS,
  DIRECTIVE_TYPE_LABELS,
  IMPORTANCE_LABELS,
  PRIORITY_LABELS,
  DURATION_UNIT_LABELS,
} from '@/modules/shared/types/minister-directive-enums';
import type { DirectiveStatus } from '@/modules/shared/types/minister-directive-enums';
import { VoicePlayer } from '@/modules/UC19/components/VoicePlayer';
import { Pagination } from '@/modules/shared/components/pagination';
import { SchedulerModal } from '@/modules/shared/features/meeting-request-form';

const PAGE_SIZE = 10;

const STATUS_TABS: { id: DirectiveStatus; label: string }[] = [
  { id: 'TAKEN', label: DIRECTIVE_STATUS_LABELS.TAKEN },
  { id: 'ADOPTED', label: DIRECTIVE_STATUS_LABELS.ADOPTED },
];

const STATUS_BADGE: Record<DirectiveStatus, { color: string; dot: string }> = {
  TAKEN: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  ADOPTED: { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
};

/* ── Directive Card ── */
function DirectiveCard({
  directive,
  onTake,
  onRequestMeeting,
}: {
  directive: MinisterDirective;
  onTake: (d: MinisterDirective) => void;
  onRequestMeeting: (d: MinisterDirective) => void;
}) {
  const [copied, setCopied] = useState(false);
  const badge = STATUS_BADGE[directive.status] || STATUS_BADGE.TAKEN;
  const hasVoice = !!directive.voice_play_url;
  const isUrgent = directive.priority === 'URGENT' || directive.priority === 'VERY_URGENT';
  const isImportant = directive.importance === 'IMPORTANT' || directive.importance === 'VERY_IMPORTANT';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(directive.title);
    setCopied(true);
    toast.success('تم النسخ');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-card border border-border/40 rounded-xl transition-all hover:shadow-sm hover:border-border/70 overflow-hidden">
      <div className="px-5 py-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
            <FileText className="size-[18px]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14px] font-semibold text-foreground leading-relaxed line-clamp-2 flex-1">
                {directive.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="نسخ المحتوى"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
                <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-medium', badge.color)}>
                  <span className={cn('size-1.5 rounded-full', badge.dot)} />
                  {DIRECTIVE_STATUS_LABELS[directive.status]}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {format(new Date(directive.created_at), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Voice */}
        {hasVoice && (
          <div className="mt-3 mr-12 rounded-lg bg-muted/30 px-3 py-2">
            <VoicePlayer url={directive.voice_play_url!} compact />
          </div>
        )}

        {/* Tags */}
        <div className="mt-3 mr-12 flex flex-wrap items-center gap-1.5">
          {directive.directive_type && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <FileText className="size-3" />
              {DIRECTIVE_TYPE_LABELS[directive.directive_type] || directive.directive_type}
            </span>
          )}
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600">
              <AlertTriangle className="size-3" />
              {PRIORITY_LABELS[directive.priority!]}
            </span>
          )}
          {isImportant && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <Zap className="size-3" />
              {IMPORTANCE_LABELS[directive.importance!]}
            </span>
          )}
          {directive.due_duration_enabled && directive.due_duration_value && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              {directive.due_duration_value} {DURATION_UNIT_LABELS[directive.due_duration_unit || 'DAY']}
            </span>
          )}
          {hasVoice && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-0.5 text-[10px] text-primary font-medium">
              <Volume2 className="size-3" />
              صوتي
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 mr-12 flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onTake(directive); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-amber-400 text-amber-600 hover:bg-amber-50 hover:shadow-sm"
          >
            <XCircle className="w-3.5 h-3.5" />
            الأخذ بالتوجيه
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRequestMeeting(directive); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-foreground transition-colors hover:opacity-90 bg-primary"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            طلب إجتماع
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
const Directives: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<DirectiveStatus>('TAKEN');
  const [currentPage, setCurrentPage] = useState(1);

  // Meeting form
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [schedulerDirective, setSchedulerDirective] = useState<{ directiveId?: string; directiveText?: string }>({});

  const queryKey = ['uc02-scheduling-directives', activeStatus, currentPage];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      listDirectives({
        directive_type: 'SCHEDULING',
        status: activeStatus,
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
  });

  // Tab counts
  const { data: takenCount } = useQuery({
    queryKey: ['uc02-scheduling-count', 'TAKEN'],
    queryFn: () => listDirectives({ directive_type: 'SCHEDULING', status: 'TAKEN', skip: 0, limit: 1 }),
  });
  const { data: adoptedCount } = useQuery({
    queryKey: ['uc02-scheduling-count', 'ADOPTED'],
    queryFn: () => listDirectives({ directive_type: 'SCHEDULING', status: 'ADOPTED', skip: 0, limit: 1 }),
  });

  const directives = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const counts: Record<DirectiveStatus, number> = {
    TAKEN: takenCount?.total ?? 0,
    ADOPTED: adoptedCount?.total ?? 0,
  };

  const handleTake = async (d: MinisterDirective) => {
    try {
      await takeDirective(d.id);
      toast.success('تم الأخذ بالتوجيه');
      queryClient.invalidateQueries({ queryKey: ['uc02-scheduling'] });
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleRequestMeeting = async (d: MinisterDirective) => {
    setSchedulerDirective({ directiveId: d.id, directiveText: d.title });
    setMeetingFormOpen(true);
    try {
      await requestMeetingFromDirective(d.id);
    } catch { /* handled by form */ }
  };

  const handleTabChange = (status: DirectiveStatus) => {
    setActiveStatus(status);
    setCurrentPage(1);
  };

  return (
    <>
      <SchedulerModal
        open={meetingFormOpen}
        onOpenChange={setMeetingFormOpen}
        directiveId={schedulerDirective?.directiveId}
        directiveText={schedulerDirective?.directiveText}
      />

      <div className="space-y-5 px-4 sm:px-6 py-5" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <ScrollText className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">توجيهات الجدولة</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              إدارة ومتابعة جميع التوجيهات · {(counts.TAKEN + counts.ADOPTED)} توجيه
            </p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 border-b border-border/40 pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative px-4 py-2 text-[13px] font-medium transition-colors rounded-t-lg',
                activeStatus === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={cn(
                  'mr-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  activeStatus === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {counts[tab.id]}
                </span>
              )}
              {activeStatus === tab.id && (
                <span className="absolute bottom-0 inset-x-1 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/20 bg-card p-5">
                <div className="flex gap-3">
                  <div className="size-9 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-1/4 rounded bg-muted" />
                    <div className="flex gap-2 mt-1">
                      <div className="h-5 w-14 rounded bg-muted" />
                      <div className="h-5 w-12 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-destructive font-medium">حدث خطأ أثناء تحميل البيانات</p>
            </div>
          ) : directives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
                <FileText className="size-6 text-muted-foreground" />
              </div>
              <p className="text-[14px] font-medium text-foreground mb-1">لا توجد توجيهات</p>
              <p className="text-[12px] text-muted-foreground">ستظهر التوجيهات هنا عند إنشائها</p>
            </div>
          ) : (
            directives.map((d) => (
              <DirectiveCard
                key={d.id}
                directive={d}
                onTake={handleTake}
                onRequestMeeting={handleRequestMeeting}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-2 pb-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </>
  );
};

export default Directives;
