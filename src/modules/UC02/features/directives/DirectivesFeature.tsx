import { useState } from 'react';
import { CalendarDays, CheckSquare, Plus } from 'lucide-react';
import {
  DirectivesList,
  type DirectiveCardAction,
} from '@/modules/shared/features/directives-list';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import type { DirectiveStatus } from '@/modules/shared/types/minister-directive-enums';
import type { MinisterDirective } from '@/modules/shared/api/directives';
import { SchedulerModal } from '@/modules/shared/features/meeting-request-form';
import { Button } from '@/lib/ui';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/lib/ui/components/alert-dialog';

const STATUS_TABS: { value: DirectiveStatus; label: string }[] = [
  { value: 'TAKEN', label: 'التوجيهات الحالية' },
  { value: 'ADOPTED', label: 'التوجيهات السابقة' },
];

export const DirectivesFeature = () => {
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [schedulerDirective, setSchedulerDirective] = useState<{ directiveId?: string; directiveText?: string }>({});
  const [confirmDirective, setConfirmDirective] = useState<MinisterDirective | null>(null);

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
      icon: <CheckSquare className="size-3" />,
      className: 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:scale-[1.03] active:scale-[0.97]',
      hidden: (d: MinisterDirective) => d.scheduling_officer_status === 'CLOSED',
      onClick: (d: MinisterDirective) => setConfirmDirective(d),
    },
    {
      id: 'meeting',
      label: 'طلب إجتماع',
      icon: <CalendarDays className="size-3" />,
      className: 'bg-teal-500/10 border border-teal-500/30 text-teal-600 hover:bg-teal-500/20 hover:scale-[1.03] active:scale-[0.97]',
      onClick: async (d: MinisterDirective) => {
        setSchedulerDirective({ directiveId: d.id, directiveText: d.title });
        setMeetingFormOpen(true);
        await list.handleRequestMeeting(d);
      },
    },
  ];

  const total = (list.statusCounts['TAKEN'] || 0) + (list.statusCounts['ADOPTED'] || 0);

  const handleConfirmTake = async () => {
    if (confirmDirective) {
      await list.handleTakeDirective(confirmDirective);
      setConfirmDirective(null);
    }
  };

  const handleCreateMeeting = () => {
    setSchedulerDirective({});
    setMeetingFormOpen(true);
  };

  return (
    <>
      <SchedulerModal
        open={meetingFormOpen}
        onOpenChange={setMeetingFormOpen}
        directiveId={schedulerDirective?.directiveId}
        directiveText={schedulerDirective?.directiveText}
      />

      <AlertDialog open={!!confirmDirective} onOpenChange={(open) => !open && setConfirmDirective(null)}>
        <AlertDialogContent dir="rtl" className="max-w-sm rounded-2xl p-6">
          <AlertDialogHeader className="gap-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
              <CheckSquare className="size-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-center text-base">تأكيد الأخذ بالتوجيه</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] leading-relaxed">
              هل أنت متأكد من الأخذ بهذا التوجيه؟
              {confirmDirective?.title && (
                <span className="font-medium text-foreground mt-2 block line-clamp-2 text-[12px]">
                  {confirmDirective.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row mt-2">
            <AlertDialogAction onClick={handleConfirmTake} className="flex-1 rounded-xl h-10">تأكيد</AlertDialogAction>
            <AlertDialogCancel className="flex-1 rounded-xl h-10">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DirectivesList
        title="توجيهات الجدولة"
        subtitle="إدارة ومتابعة جميع التوجيهات"
        total={total}
        tabMode="status"
        statusTabs={STATUS_TABS}
        activeStatus={list.activeStatus}
        onStatusChange={list.handleStatusChange}
        statusCounts={list.statusCounts}
        directives={list.directives}
        isLoading={list.isLoading}
        error={list.error}
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        onPageChange={list.handlePageChange}
        statusField="scheduling_officer_status"
        actions={actions}
        headerRight={
          <Button
            onClick={handleCreateMeeting}
            className="rounded-xl gap-2 px-5 h-10 shadow-sm"
          >
            <Plus className="size-4" />
            إنشاء اجتماع
          </Button>
        }
      />
    </>
  );
};

export default DirectivesFeature;
