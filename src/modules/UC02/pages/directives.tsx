import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, XCircle } from 'lucide-react';
import {
  DirectivesList,
  type DirectiveCardAction,
} from '@/modules/shared/features/directives-list';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import {
  DIRECTIVE_STATUS_LABELS,
  DIRECTIVE_TYPE_OPTIONS,
} from '@/modules/shared/types/minister-directive-enums';
import type { DirectiveStatus } from '@/modules/shared/types/minister-directive-enums';
import type { MinisterDirective } from '@/modules/shared/api/directives';
import { SchedulerModal } from '@/modules/shared/features/meeting-request-form';

const STATUS_TABS: { value: DirectiveStatus; label: string }[] = [
  { value: 'TAKEN', label: DIRECTIVE_STATUS_LABELS.TAKEN },
  { value: 'ADOPTED', label: DIRECTIVE_STATUS_LABELS.ADOPTED },
];

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
      className: 'border border-amber-400 text-amber-600 hover:bg-amber-50 hover:shadow-sm',
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

  return (
    <>
      <SchedulerModal
        open={meetingFormOpen}
        onOpenChange={setMeetingFormOpen}
        directiveId={schedulerDirective?.directiveId}
        directiveText={schedulerDirective?.directiveText}
      />
      <DirectivesList
        title="توجيهات الجدولة"
        subtitle="إدارة ومتابعة جميع التوجيهات"
        total={(list.statusCounts['TAKEN'] || 0) + (list.statusCounts['ADOPTED'] || 0)}
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
