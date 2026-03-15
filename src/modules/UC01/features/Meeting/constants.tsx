import { NavigateFunction } from 'react-router-dom';
import { Calendar, Send, Trash2 } from 'lucide-react';
import { TableColumn, TruncatedWithTooltip } from '@/modules/shared';
import { StatusBadge } from '@/modules/shared/components/status-badge';
import { MeetingStatus } from '@/modules/shared/types';
import { MeetingDisplayData } from '../../utils/meetingMapper';

export interface CreateTableColumnsOptions {
  startIndex?: number;
  onSubmitDraft?: (draftId: string) => void;
  submittingDraftId?: string | null;
  onResubmitToScheduling?: (draftId: string) => void;
  submittingResubmitToSchedulingId?: string | null;
  onResubmitToContent?: (draftId: string) => void;
  submittingResubmitToContentId?: string | null;
  openConfirmModal?: (message: string, onConfirm: () => void) => void;
  onDeleteDraft?: (draftId: string) => void;
  deletingDraftId?: string | null;
}

/** Card-style compact actions (matches meeting-card.tsx) */
const CARD_ACTION_SEND =
  'flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-[#048F86] hover:bg-[#037a72] text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 transition-colors';
const CARD_ACTION_DELETE =
  'flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 transition-colors';

export const MEETING_ACTION_CONFIRM_MESSAGE = 'هل أنت متأكد من الإرسال؟';
export const MEETING_ACTION_CONFIRM_TITLE = 'تأكيد الإرسال';

export const createTableColumns = (
  _navigate: NavigateFunction,
  options?: CreateTableColumnsOptions
): TableColumn<MeetingDisplayData>[] => {
  const startIndex = options?.startIndex ?? 0;
  const onSubmitDraft = options?.onSubmitDraft;
  const submittingDraftId = options?.submittingDraftId;
  const onResubmitToScheduling = options?.onResubmitToScheduling;
  const submittingResubmitToSchedulingId = options?.submittingResubmitToSchedulingId;
  const onResubmitToContent = options?.onResubmitToContent;
  const submittingResubmitToContentId = options?.submittingResubmitToContentId;
  const openConfirmModal = options?.openConfirmModal;
  const onDeleteDraft = options?.onDeleteDraft;
  const deletingDraftId = options?.deletingDraftId;
  const hasActions =
    onSubmitDraft || onResubmitToScheduling || onResubmitToContent || onDeleteDraft;

  const handleActionClick = (handler: (draftId: string) => void, draftId: string) => {
    if (openConfirmModal) {
      openConfirmModal(MEETING_ACTION_CONFIRM_MESSAGE, () => handler(draftId));
    }
  };

  return [
    {
      id: 'itemNumber',
      header: '#',
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
          <TruncatedWithTooltip title={row.requestNumber || '-'}>
            {row.requestNumber || '-'}
          </TruncatedWithTooltip>
        </div>
      ),
    },
    {
      id: 'requestDate',
      header: 'تاريخ الطلب',
      width: 'w-[500px]',
      render: (row) => (
        <div className="w-full flex justify-start">
          <TruncatedWithTooltip title={row.requestDate || '-'}>
            {row.requestDate || '-'}
          </TruncatedWithTooltip>
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
          <TruncatedWithTooltip title={title}>
            {title}
          </TruncatedWithTooltip>
        );
      },
    },
    {
      id: 'meetingCategory',
      header: 'فئة الاجتماع',
      width: 'w-[350px]',
      render: (row) => (
        <TruncatedWithTooltip title={row.meetingCategory || '-'}>
          {row.meetingCategory || '-'}
        </TruncatedWithTooltip>
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
      width: 'w-[400px]',
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
      width: 'w-[400px]',
      render: (row) => (
        <TruncatedWithTooltip title={row.returnNotes || '-'}>
          {row.returnNotes || '-'}
        </TruncatedWithTooltip>
      ),
    },
    ...(hasActions
      ? [
          {
            id: 'actions',
            header: '',
            width: 'min-w-[220px] w-[220px]',
            align: 'center' as const,
            render: (row: MeetingDisplayData) => {
              if (row.status === MeetingStatus.DRAFT) {
                return (
                  <div className="flex flex-nowrap justify-center items-center gap-2 w-full min-w-0">
                    {onSubmitDraft && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(onSubmitDraft, row.id);
                        }}
                        disabled={submittingDraftId === row.id}
                        className={CARD_ACTION_SEND}
                        title={submittingDraftId === row.id ? 'جاري الإرسال...' : 'إرسال المسودة'}
                      >
                        <span>{submittingDraftId === row.id ? 'جاري...' : 'إرسال'}</span>
                        <Send className="w-3.5 h-3.5 rotate-[-90deg] flex-shrink-0" />
                      </button>
                    )}
                    {onDeleteDraft && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDraft(row.id);
                        }}
                        disabled={deletingDraftId === row.id}
                        className={CARD_ACTION_DELETE}
                        title={deletingDraftId === row.id ? 'جاري الحذف...' : 'حذف المسودة'}
                      >
                        <span>{deletingDraftId === row.id ? 'جاري...' : 'حذف'}</span>
                        <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                      </button>
                    )}
                  </div>
                );
              }
              if (
                row.status === MeetingStatus.RETURNED_FROM_SCHEDULING &&
                onResubmitToScheduling
              ) {
                const submitting = submittingResubmitToSchedulingId === row.id;
                return (
                  <div className="flex flex-nowrap justify-center items-center gap-2 w-full min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(onResubmitToScheduling, row.id);
                      }}
                      disabled={submitting}
                      className={CARD_ACTION_SEND}
                      title={submitting ? 'جاري الإرسال...' : 'إحالة للمسؤول'}
                    >
                      <span>{submitting ? 'جاري...' : 'إحالة للمسؤول'}</span>
                      <Send className="w-3.5 h-3.5 rotate-[-90deg] flex-shrink-0" />
                    </button>
                  </div>
                );
              }
              if (
                row.status === MeetingStatus.RETURNED_FROM_CONTENT &&
                onResubmitToContent
              ) {
                const submitting = submittingResubmitToContentId === row.id;
                return (
                  <div className="flex flex-nowrap justify-center items-center gap-2 w-full min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(onResubmitToContent, row.id);
                      }}
                      disabled={submitting}
                      className={CARD_ACTION_SEND}
                      title={submitting ? 'جاري الإرسال...' : 'إحالة للمسؤول'}
                    >
                      <span>{submitting ? 'جاري...' : 'إحالة للمسؤول'}</span>
                      <Send className="w-3.5 h-3.5 rotate-[-90deg] flex-shrink-0" />
                    </button>
                  </div>
                );
              }
              return null;
            },
          } as TableColumn<MeetingDisplayData>,
        ]
      : []),
  ];
};
