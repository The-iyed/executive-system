import { NavigateFunction } from 'react-router-dom';
import { Calendar, Send } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@sanad-ai/ui';
import { TableColumn } from '@shared/components/data-table';
import { StatusBadge } from '@shared/components/status-badge';
import { MeetingStatus } from '@shared/types';
import { MeetingDisplayData } from '../../utils/meetingMapper';

export interface CreateTableColumnsOptions {
  startIndex?: number;
  /** When provided, draft rows show a "Submit draft" action that calls this with draft id */
  onSubmitDraft?: (draftId: string) => void;
  submittingDraftId?: string | null;
}

export const createTableColumns = (
  _navigate: NavigateFunction,
  options?: CreateTableColumnsOptions
): TableColumn<MeetingDisplayData>[] => {
  const startIndex = options?.startIndex ?? 0;
  const onSubmitDraft = options?.onSubmitDraft;
  const submittingDraftId = options?.submittingDraftId;
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
      width: 'w-[500px]',
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
      render: (row) => {
        const title = row.title || '-';
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-full text-base font-normal text-right text-gray-600 leading-5 truncate">
                {title}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[350px] bg-neutral-900 text-white border-neutral-700"
            >
              <p className="break-words text-right">{title}</p>
            </TooltipContent>
          </Tooltip>
        );
      },
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
      width: 'w-[310px]',
      render: (row) => (
        <div className="w-full flex justify-start">
          <StatusBadge status={row.status} label={row.statusLabel} />
        </div>
      ),
    },
    {
      id: 'isDataComplete',
      header: 'البيانات مكتملة؟',
      width: 'w-[310px]',
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
    ...(onSubmitDraft
      ? [
          {
            id: 'actions',
            header: '',
            width: 'min-w-[200px] w-[200px]',
            align: 'center' as const,
            render: (row: MeetingDisplayData) =>
              row.status === MeetingStatus.DRAFT ? (
                <div className="flex justify-center w-full min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubmitDraft(row.id);
                    }}
                    disabled={submittingDraftId === row.id}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#048F86] hover:bg-[#037a72] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                  >
                    <span>{submittingDraftId === row.id ? 'جاري الإرسال...' : 'إرسال المسودة'}</span>
                    <Send className="w-4 h-4 rotate-[-90deg] flex-shrink-0" />
                  </button>
                </div>
              ) : null,
          } as TableColumn<MeetingDisplayData>,
        ]
      : []),
  ];
};
