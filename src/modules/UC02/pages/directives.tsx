import { useState } from 'react';
import { ChevronDown, ChevronUp, Hash, Clock, CalendarDays, XCircle, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/ui';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import { DIRECTIVE_STATUS_LABELS } from '@/modules/shared/types/minister-directive-enums';
import type { DirectiveStatus } from '@/modules/shared/types/minister-directive-enums';
import type { MinisterDirective } from '@/modules/shared/api/directives';
import { SchedulerModal } from '@/modules/shared/features/meeting-request-form';
import { Pagination } from '@/modules/shared/components/pagination';

/* ── Tabs config ── */
const STATUS_TABS: { value: DirectiveStatus; label: string }[] = [
  { value: 'TAKEN', label: 'التوجيهات الحالية' },
  { value: 'ADOPTED', label: 'التوجيهات السابقة' },
];

/* ── Accordion Card ── */
function DirectiveAccordionCard({
  directive,
  onTake,
  onMeeting,
}: {
  directive: MinisterDirective;
  onTake: (d: MinisterDirective) => void;
  onMeeting: (d: MinisterDirective) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusLabel = DIRECTIVE_STATUS_LABELS[directive.status] || directive.status;
  const dateStr = format(new Date(directive.created_at), 'dd MMMM yyyy', { locale: ar });

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(directive.title);
    setCopied(true);
    toast.success('تم النسخ');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 transition-all bg-card',
        expanded ? 'border-primary/40 shadow-sm' : 'border-border/30 hover:border-border/50',
      )}
    >
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-right"
        type="button"
      >
        {/* Expand icon */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground">
          {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
        </div>

        {/* Hash icon */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
          <Hash className="size-4" />
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground shrink-0">
          <span>{dateStr}</span>
          <Clock className="size-3.5" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Title */}
        <h3 className="text-[14px] font-semibold text-foreground truncate max-w-[40%]">
          {directive.title}
        </h3>

        {/* Status badge */}
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[11px] font-bold shrink-0',
          directive.status === 'ADOPTED'
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'bg-accent text-accent-foreground border-accent',
        )}>
          {statusLabel}
        </span>

        {/* Status dot */}
        <span className={cn(
          'size-2.5 rounded-full shrink-0',
          directive.status === 'ADOPTED' ? 'bg-primary' : 'bg-accent-foreground',
        )} />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/20 px-5 py-4 space-y-4">
          {/* Details row */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-foreground">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">تاريخ التوجيه:</span>
              <span className="font-semibold">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">رقم التوجيه:</span>
              <span className="font-semibold">{directive.id.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">الموعد النهائي:</span>
              <span className="font-semibold">{dateStr}</span>
            </div>
          </div>

          {/* Copy button */}
          <div className="flex justify-center">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              {copied ? 'تم النسخ' : 'نسخ نص التوجيه'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onMeeting(directive); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <CalendarDays className="size-4" />
              طلب إجتماع
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTake(directive); }}
              className="flex items-center gap-2 rounded-lg border-2 border-amber-400 px-5 py-2.5 text-[13px] font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <XCircle className="size-4" />
              الأخذ بالتوجيه
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Skeleton ── */
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border-2 border-border/20 bg-card px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="size-8 rounded-lg bg-muted" />
        <div className="size-8 rounded-lg bg-muted" />
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="flex-1" />
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-6 w-20 rounded bg-muted" />
        <div className="size-2.5 rounded-full bg-muted" />
      </div>
    </div>
  );
}

/* ── Page ── */
const Directives: React.FC = () => {
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [schedulerDirective, setSchedulerDirective] = useState<{ directiveId?: string; directiveText?: string }>({});

  const list = useDirectivesList({
    queryKeyPrefix: 'uc02-scheduling',
    tabMode: 'status',
    fixedDirectiveType: 'SCHEDULING',
    defaultStatus: 'TAKEN',
    statusTabs: ['TAKEN', 'ADOPTED'],
  });

  const handleTake = (d: MinisterDirective) => list.handleTakeDirective(d);
  const handleMeeting = async (d: MinisterDirective) => {
    setSchedulerDirective({ directiveId: d.id, directiveText: d.title });
    setMeetingFormOpen(true);
    await list.handleRequestMeeting(d);
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
        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 border-b border-border/40 pb-0">
          {STATUS_TABS.map((tab) => {
            const count = list.statusCounts[tab.value] || 0;
            const isActive = list.activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => list.handleStatusChange(tab.value)}
                className={cn(
                  'relative flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-colors rounded-t-lg',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-2 h-[2.5px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="space-y-3">
          {list.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : list.error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-destructive font-medium">حدث خطأ أثناء تحميل البيانات</p>
            </div>
          ) : list.directives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[14px] font-medium text-foreground mb-1">لا توجد توجيهات</p>
              <p className="text-[12px] text-muted-foreground">ستظهر التوجيهات هنا عند إنشائها</p>
            </div>
          ) : (
            list.directives.map((d) => (
              <DirectiveAccordionCard
                key={d.id}
                directive={d}
                onTake={handleTake}
                onMeeting={handleMeeting}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {list.totalPages > 1 && (
          <div className="pt-2 pb-4">
            <Pagination currentPage={list.currentPage} totalPages={list.totalPages} onPageChange={list.handlePageChange} />
          </div>
        )}
      </div>
    </>
  );
};

export default Directives;
