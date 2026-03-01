import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, Button } from '@sanad-ai/ui';
import { DataTable, Pagination, MeetingStatus, ContentBar, CardsGrid, ViewType } from '@shared';
import { PAGINATION, createTableColumns, MEETING_ACTION_CONFIRM_MESSAGE, MEETING_ACTION_CONFIRM_TITLE, MEETING_TABS } from '../../utils';
import { useMeetings, useSubmitMeeting } from '../../hooks';
import { useMeetingFormDrawer } from '../MeetingForm/hooks/useMeetingFormDrawer';
import { PATH } from '../../routes/paths';

const Meeting: React.FC = () => {
  const navigate = useNavigate();
  const { openCreateDrawer } = useMeetingFormDrawer();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingConfirmRef = useRef<(() => void) | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus>(MeetingStatus.DRAFT);
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [view, setView] = useState<ViewType>('cards');

  useEffect(() => {
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  }, [searchValue, statusFilter]);

  const { meetings, isLoading, error, totalPages } = useMeetings({
    searchValue,
    statusFilter,
    currentPage,
  });

  const {
    submitMeeting,
    isSubmitting,
    submittingMeetingId,
    submittingStatus,
  } = useSubmitMeeting();

  const onSubmitDraft = useCallback(
    (draftId: string) => submitMeeting({ meetingId: draftId, status: MeetingStatus.DRAFT }),
    [submitMeeting]
  );
  const onResubmitToScheduling = useCallback(
    (draftId: string) => submitMeeting({ meetingId: draftId, status: MeetingStatus.RETURNED_FROM_SCHEDULING }),
    [submitMeeting]
  );
  const onResubmitToContent = useCallback(
    (draftId: string) => submitMeeting({ meetingId: draftId, status: MeetingStatus.RETURNED_FROM_CONTENT }),
    [submitMeeting]
  );

  const openConfirmModal = useCallback((_message: string, onConfirm: () => void) => {
    pendingConfirmRef.current = onConfirm;
    setConfirmOpen(true);
  }, []);

  const handleConfirmClose = useCallback((open: boolean) => {
    if (!open) {
      pendingConfirmRef.current = null;
      setConfirmOpen(false);
    }
  }, []);

  const handleConfirmAction = useCallback(() => {
    pendingConfirmRef.current?.();
    pendingConfirmRef.current = null;
    setConfirmOpen(false);
  }, []);

  const tableColumns = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGINATION.ITEMS_PER_PAGE;
    return createTableColumns(navigate, {
      startIndex,
      onSubmitDraft,
      submittingDraftId: submittingStatus === MeetingStatus.DRAFT ? submittingMeetingId : null,
      onResubmitToScheduling,
      submittingResubmitToSchedulingId: submittingStatus === MeetingStatus.RETURNED_FROM_SCHEDULING ? submittingMeetingId : null,
      onResubmitToContent,
      submittingResubmitToContentId: submittingStatus === MeetingStatus.RETURNED_FROM_CONTENT ? submittingMeetingId : null,
      openConfirmModal,
    });
  }, [
    navigate,
    currentPage,
    onSubmitDraft,
    onResubmitToScheduling,
    onResubmitToContent,
    submittingMeetingId,
    submittingStatus,
    openConfirmModal,
  ]);

  return (
     <>
      <Dialog open={confirmOpen} onOpenChange={handleConfirmClose}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border border-gray-200/80 bg-white shadow-xl" dir="rtl">
          <DialogHeader className="text-right gap-2">
            <div className="flex items-center gap-3 text-right">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50">
                <Send className="h-6 w-6 text-teal-600" strokeWidth={1.5} />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {MEETING_ACTION_CONFIRM_TITLE}
              </DialogTitle>
            </div>
            <DialogDescription className="text-right text-base text-gray-600 pt-1">
              {MEETING_ACTION_CONFIRM_MESSAGE}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-start sm:justify-start mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleConfirmClose(false)}
              className="min-w-[100px]"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAction}
              className="min-w-[100px] bg-[#048F86] hover:bg-[#037a72] text-white"
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div>
        <ContentBar
          showViewSwitcher={true}
          onViewChange={setView}
          view={view}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          primaryAction={{
            label: 'إنشاء اجتماع',
            variant: 'primary',
            onClick: openCreateDrawer,
          }}
          filterTabs={MEETING_TABS}
          activeFilterId={statusFilter}
          onFilterChange={(id) => setStatusFilter(id as MeetingStatus)}
        />
         {isLoading ? (
           <div className="flex items-center justify-center py-12">
             <div className="text-gray-600">جاري التحميل...</div>
           </div>
         ) : error ? (
           <div className="flex items-center justify-center py-12">
             <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
           </div>
         ) : meetings.length === 0 ? (
           <div className="flex items-center justify-center py-12">
             <div className="text-gray-600">لا توجد بيانات</div>
           </div>
         ) : (
           <>
             {view === 'table' ? (
                <DataTable
                  columns={tableColumns}
                  data={meetings}
                  onRowClick={(row) =>
                    navigate(PATH.MEETING_PREVIEW.replace(':id', row.id))
                  }
                />
             ) : (
                <CardsGrid
                  meetings={meetings}
                  onView={(meeting) => navigate(PATH.MEETING_PREVIEW.replace(':id', meeting.id))}
                  onDetails={(meeting) => navigate(PATH.MEETING_PREVIEW.replace(':id', meeting.id))}
                  onAction={(meeting) => {
                    if (
                      meeting.status === MeetingStatus.DRAFT ||
                      meeting.status === MeetingStatus.RETURNED_FROM_SCHEDULING ||
                      meeting.status === MeetingStatus.RETURNED_FROM_CONTENT
                    ) {
                      openConfirmModal(MEETING_ACTION_CONFIRM_MESSAGE, () =>
                        submitMeeting({ meetingId: meeting.id, status: meeting.status })
                      );
                    }
                  }}
                  getActionLabel={(meeting) => {
                    if (meeting.status === MeetingStatus.DRAFT) {
                      return isSubmitting && submittingMeetingId === meeting.id ? 'جاري الإرسال...' : 'إرسال المسودة';
                    }
                    if (meeting.status === MeetingStatus.RETURNED_FROM_SCHEDULING) {
                      return isSubmitting && submittingMeetingId === meeting.id ? 'جاري الإرسال...' : 'إحالة للمسؤول';
                    }
                    if (meeting.status === MeetingStatus.RETURNED_FROM_CONTENT) {
                      return isSubmitting && submittingMeetingId === meeting.id ? 'جاري الإرسال...' : 'إحالة للمحتوى';
                    }
                    return undefined;
                  }}
                  getActionLoading={(meeting) => isSubmitting && submittingMeetingId === meeting.id}
                />
             )}
             
             {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
             )}
           </>
         )}
      </div>
     </>
  );
};

export default Meeting;