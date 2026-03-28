import { useState } from 'react';
import { CalendarDays, CheckSquare } from 'lucide-react';
import {
  DirectivesList,
  type DirectiveCardAction,
} from '@/modules/shared/features/directives-list';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import type { DirectiveStatus } from '@/modules/shared/types/minister-directive-enums';
import type { MinisterDirective } from '@/modules/shared/api/directives';
import { SchedulerModal } from '@/modules/shared/features/meeting-request-form';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/lib/ui/components/alert-dialog';

const STATUS_TABS: { value: DirectiveStatus; label: string }[] = [
  { value: 'TAKEN', label: 'التوجيهات الحالية' },
  { value: 'ADOPTED', label: 'التوجيهات السابقة' },
];

const Directives: React.FC = () => {
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
      icon: <CheckSquare className="w-3.5 h-3.5" />,
      className: 'border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 hover:shadow-sm',
      onClick: (d: MinisterDirective) => setConfirmDirective(d),
    },
    {
      id: 'meeting',
      label: 'طلب إجتماع',
      icon: <CalendarDays className="w-3.5 h-3.5" />,
      className: 'text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm hover:shadow',
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

  return (
    <>
      <SchedulerModal
        open={meetingFormOpen}
        onOpenChange={setMeetingFormOpen}
        directiveId={schedulerDirective?.directiveId}
        directiveText={schedulerDirective?.directiveText}
      />

      <AlertDialog open={!!confirmDirective} onOpenChange={(open) => !open && setConfirmDirective(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الأخذ بالتوجيه</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من الأخذ بهذا التوجيه؟
              <br />
              <span className="font-medium text-foreground mt-1 block line-clamp-2">
                {confirmDirective?.title}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={handleConfirmTake}>تأكيد</AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
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
        statusField="status"
        actions={actions}
      />
    </>
  );
};

export default Directives;
