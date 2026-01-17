import { ColumnDef } from '@tanstack/react-table';
import { MeetingDisplayData } from './meetingMapper';
import { Eye } from 'lucide-react';
import { Badge } from '@sanad-ai/ui';

export const createTableColumns = (
  navigate: (path: string) => void
): ColumnDef<MeetingDisplayData>[] => [
  {
    id: 'action',
    header: '',
    cell: ({ row }) => (
      <button
        onClick={() => navigate(`/uc08/meeting/${row.original.id}/preview`)}
        className="flex items-center justify-center w-8 h-8 text-[#008774] hover:bg-[#F0FDF4] rounded-lg transition-colors"
        aria-label="عرض التفاصيل"
      >
        <Eye className="w-4 h-4" />
      </button>
    ),
    size: 60,
  },
  {
    id: 'itemNumber',
    header: 'رقم البند',
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      return pageIndex * pageSize + row.index + 1;
    },
    size: 100,
  },
  {
    accessorKey: 'requestNumber',
    header: 'رقم الطلب',
    size: 150,
  },
  {
    accessorKey: 'title',
    header: 'عنوان الاجتماع',
    size: 200,
  },
  {
    accessorKey: 'coordinator',
    header: 'مقدم الطلب',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.coordinatorAvatar && (
          <img
            src={row.original.coordinatorAvatar}
            alt={row.original.coordinator}
            className="w-6 h-6 rounded-full"
          />
        )}
        <span>{row.original.coordinator}</span>
      </div>
    ),
    size: 150,
  },
  {
    accessorKey: 'date',
    header: 'تاريخ الإرسال',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.original.date}</span>
      </div>
    ),
    size: 150,
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusLabel = row.original.statusLabel;
      
      const statusColors: Record<string, string> = {
        [status]: status === 'UNDER_REVIEW' 
          ? 'bg-[#E0F2FE] text-[#0369A1]'
          : status === 'RETURNED_FROM_SCHEDULING_MANAGER' || status === 'RETURNED_FROM_CONTENT_MANAGER'
          ? 'bg-[#FEF3C7] text-[#92400E]'
          : 'bg-[#F3F4F6] text-[#374151]',
      };
      
      return (
        <Badge className={statusColors[status] || 'bg-[#F3F4F6] text-[#374151]'}>
          {statusLabel}
        </Badge>
      );
    },
    size: 150,
  },
];
