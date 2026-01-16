import { NavigateFunction } from 'react-router-dom';
import { Eye, Calendar } from 'lucide-react';
import { TableColumn } from '@shared/components/data-table';
import { StatusBadge } from '@shared/components/status-badge';
import { MeetingDisplayData } from '../../utils/meetingMapper';
import { PATH } from '../../routes/paths';

export const createTableColumns = (navigate: NavigateFunction): TableColumn<MeetingDisplayData>[] => {
  return [
    {
      id: 'requestNumber',
      header: 'رقم الطلب',
      width: 'w-40',
      render: (row) => (
        // <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.requestNumber || '-'}
          </span>
      ),
    },
    {
      id: 'title',
      header: 'عنوان الاجتماع',
      // width: 'flex-1',
      render: (row) => (
        // <div className="w-full flex justify-start">
          <span className="text-base font-normal text-right text-gray-600 leading-5">
            {row.title || '-'}
          </span>
        // </div>
      ),
    },
    {
      id: 'date',
      header: 'التاريخ',
      render: (row) => (
        row.date ? <div className="flex flex-row justify-start items-center gap-3 w-full">
          <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-teal-600" strokeWidth={1.4} />
          </div>
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.date}
          </span>
        </div> 
        :
         <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">-</span>

      ),
    },
    {
      id: 'status',
      header: 'الحالة',
      render: (row) => (
        <div className="w-[fit-content]">
          <StatusBadge status={row.status} label={row.statusLabel} className="px-3" />
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: 'w-32',
      render: (row) => (
        <div className="w-full flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(PATH.MEETING_PREVIEW.replace(':id', row.id));
            }}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="عرض التفاصيل"
          >
            <Eye className="w-5 h-5 text-gray-600" strokeWidth={1.67} />
          </button>
        </div>
      ),
    },
  ];
};
