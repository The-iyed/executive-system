import { useState } from 'react';
import { CalendarDays, XCircle, ScrollText } from 'lucide-react';
import { cn } from '@/lib/ui';
import {
  DirectiveCard,
  type DirectiveCardAction,
} from '@/modules/shared/features/directives-list';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import { DIRECTIVE_STATUS_LABELS } from '@/modules/shared/types/minister-directive-enums';
import type { DirectiveStatus } from '@/modules/shared/types/minister-directive-enums';
import type { MinisterDirective } from '@/modules/shared/api/directives';
import { SchedulerModal } from '@/modules/shared/features/meeting-request-form';
import { Pagination } from '@/modules/shared/components/pagination';
import { FileText } from 'lucide-react';

const STATUS_TABS: { value: DirectiveStatus; label: string }[] = [
  { value: 'TAKEN', label: 'التوجيهات الحالية' },
  { value: 'ADOPTED', label: 'التوجيهات السابقة' },
];

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border/20 bg-card p-5">
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
  );
}

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

  const actions: DirectiveCardAction[] = [
    {
      id: 'take',
      label: 'الأخذ بالتوجيه',
      icon: <XCircle className="w-3.5 h-3.5" />,
      className: 'border border-primary/30 text-primary hover:bg-primary/5 hover:shadow-sm',
      onClick: (d: MinisterDirective) => list.handleTakeDirective(d),
    },
    {
      id: 'meeting',
      label: 'طلب إجتماع',
      icon: <CalendarDays className="w-3.5 h-3.5" />,
      className: 'text-primary-foreground bg-primary hover:opacity-90',
      onClick: async (d: MinisterDirective) => {
        setSchedulerDirective({ directiveId: d.id, directiveText: d.title });
        setMeetingFormOpen(true);
        await list.handleRequestMeeting(d);
      },
    },
  ];

  const total = (list.statusCounts['TAKEN'] || 0) + (list.statusCounts['ADOPTED'] || 0);

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
              إدارة ومتابعة جميع التوجيهات · {total} توجيه
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border/40 pb-0">
          {STATUS_TABS.map((tab) => {
            const count = list.statusCounts[tab.value] || 0;
            const isActive = list.activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => list.handleStatusChange(tab.value)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 text-[13px] font-medium transition-colors rounded-t-lg',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-1 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {list.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : list.error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-destructive font-medium">حدث خطأ أثناء تحميل البيانات</p>
            </div>
          ) : list.directives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
                <FileText className="size-6 text-muted-foreground" />
              </div>
              <p className="text-[14px] font-medium text-foreground mb-1">لا توجد توجيهات</p>
              <p className="text-[12px] text-muted-foreground">ستظهر التوجيهات هنا عند إنشائها</p>
            </div>
          ) : (
            list.directives.map((d) => (
              <DirectiveCard
                key={d.id}
                directive={d}
                statusField="status"
                actions={actions}
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
