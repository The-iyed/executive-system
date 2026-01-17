import { TableColumn } from '@shared/components/data-table';
import { MeetingDisplayData } from './meetingMapper';
import { Eye } from 'lucide-react';
import { Badge } from '@sanad-ai/ui';
import { PAGINATION } from './constants';

export const createTableColumns = (
  navigate: (path: string) => void,
  currentPage: number = PAGINATION.DEFAULT_PAGE,
  pageSize: number = PAGINATION.ITEMS_PER_PAGE
): TableColumn<MeetingDisplayData>[] => [
  {
    id: 'action',
    header: '',
    width: 'w-16',
    render: (row) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/uc08/meeting/${row.id}/preview`);
        }}
        className="flex items-center justify-center w-8 h-8 text-[#008774] hover:bg-[#F0FDF4] rounded-lg transition-colors"
        aria-label="عرض التفاصيل"
      >
        <Eye className="w-4 h-4" />
      </button>
    ),
  },
  {
    id: 'itemNumber',
    header: 'رقم البند',
    width: 'w-24',
    render: (_row, index) => {
      const itemNumber = (currentPage - 1) * pageSize + index + 1;
      return (
        <span className="text-base font-normal text-gray-600 leading-5">
          {itemNumber}
        </span>
      );
    },
  },
  {
    id: 'requestNumber',
    header: 'رقم الطلب',
    width: 'w-40',
    accessor: (row) => row.requestNumber,
  },
  {
    id: 'title',
    header: 'عنوان الاجتماع',
    render: (row) => (
      <span className="text-base font-normal text-gray-600 leading-5">
        {row.title || '-'}
      </span>
    ),
  },
  {
    id: 'coordinator',
    header: 'مقدم الطلب',
    width: 'w-48',
    render: (row) => (
      <div className="flex items-center gap-2">
        {row.coordinatorAvatar && (
          <img
            src={row.coordinatorAvatar}
            alt={row.coordinator || ''}
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="text-base font-normal text-gray-600 leading-5">
          {row.coordinator || '-'}
        </span>
      </div>
    ),
  },
  {
    id: 'date',
    header: 'تاريخ الإرسال',
    width: 'w-40',
    render: (row) => (
      <span className="text-base font-normal text-gray-600 leading-5">
        {row.date || '-'}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'الحالة',
    width: 'w-40',
    render: (row) => {
      const status = row.status;
      const statusLabel = row.statusLabel;
      
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
  },
];
