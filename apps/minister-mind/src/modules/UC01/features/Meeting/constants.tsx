import { NavigateFunction } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { TableColumn } from '@shared/components/data-table';
import { StatusBadge } from '@shared/components/status-badge';
import { MeetingDisplayData } from '../../utils/meetingMapper';

export const createTableColumns = (
  _navigate: NavigateFunction,
  options?: { startIndex?: number }
): TableColumn<MeetingDisplayData>[] => {
  const startIndex = options?.startIndex ?? 0;
  return [
    {
      id: 'itemNumber',
      header: 'رقم البند',
      width: 'w-[200px]',
      align: 'center',
      render: (_row, index) => (
        <div className="w-full flex justify-center">
          <span className="block max-w-full text-base font-normal text-gray-600 leading-5 truncate">
            {startIndex + index + 1}
          </span>
        </div>
      ),
    },
    {
      id: 'requestNumber',
      header: 'رقم الطلب',
      width: 'w-[300px]',
      render: (row) => (
        <div className="w-full flex justify-start">
          <span className="block max-w-full text-base font-normal text-right text-gray-600 leading-5 truncate">
            {row.requestNumber || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'requestDate',
      header: 'تاريخ الطلب',
      width: 'w-[420px]',
      render: (row) => (
        <div className="w-full flex justify-start">
          <span className="block max-w-full text-base font-normal text-right text-gray-600 leading-5 truncate">
            {row.requestDate || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'title',
      header: 'عنوان الاجتماع',
      width: 'w-[350px]',
      render: (row) => (
        <span className="block max-w-full text-base font-normal text-right text-gray-600 leading-5 truncate">
          {row.title || '-'}
        </span>
      ),
    },
    {
      id: 'meetingCategory',
      header: 'فئة الاجتماع',
      width: 'w-[350px]',
      render: (row) => (
        <span className="block max-w-full text-base font-normal text-right text-gray-600 leading-5 truncate">
          {row.meetingCategory || '-'}
        </span>
      ),
    },
    {
      id: 'meetingDate',
      header: 'تاريخ الاجتماع',
      width: 'w-[300px]',
      render: (row) => (
        row.meetingDate !== '-' ? (
          <div className="flex flex-row justify-start items-center gap-3 w-full min-w-0">
          <span className="block max-w-full text-base font-medium text-right text-gray-900 leading-5 truncate">
            {row.meetingDate}
          </span>
          <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-teal-600" strokeWidth={1.4} />
          </div>
        </div> 
        ) : (
          <span className="block max-w-full text-base font-normal text-center text-gray-600 leading-5 truncate">
            -
          </span>
        )
      ),
    },
    {
      id: 'status',
      header: 'حالة الاجتماع',
      width: 'w-[250px]',
      render: (row) => (
        <div className="w-full flex justify-start">
          <StatusBadge status={row.status} label={row.statusLabel} />
        </div>
      ),
    },
    {
      id: 'isDataComplete',
      header: 'البيانات مكتملة؟',
      width: 'w-[260px]',
      align: 'center',
      render: (row) => (
        <span className="block max-w-full text-base font-normal text-right leading-5 truncate text-gray-600">
          {row.isDataComplete == null ? '-' : row.isDataComplete ? 'نعم' : 'لا'}
        </span>
      ),
    },
    {
      id: 'returnNotes',
      header: 'ملاحظات الإعادة',
      width: 'w-[320px]',
      render: (row) => (
        <span className="block max-w-full text-base font-normal text-right text-gray-600 leading-5 truncate">
          {row.returnNotes || '-'}
        </span>
      ),
    },
  ];
};
