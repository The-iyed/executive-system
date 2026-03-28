import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Search, LayoutList, LayoutGrid, Inbox, AlertCircle, Filter, ChevronDown, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, Button, cn, Popover, PopoverTrigger, PopoverContent } from '@/lib/ui';
import { DataTable, Pagination, MeetingStatus, CardsGrid, ViewType, getMeetingTabsByRole, MeetingOwnerType } from '@/modules/shared';
import { Icon } from '@iconify/react';
import { PAGINATION, createTableColumns, MEETING_ACTION_CONFIRM_MESSAGE, MEETING_ACTION_CONFIRM_TITLE } from '../../utils';
import { useMeetings, useSubmitMeeting } from '../../hooks';
import { PATH } from '../../routes/paths';
import { SubmitterModal } from '@/modules/shared/features/meeting-request-form';
import { deleteDraft } from '../../data/draftApi';
/** Clear draft data from localStorage */
const clearDraftData = () => {
  try {
    Object.keys(localStorage).filter(k => k.startsWith('draft')).forEach(k => localStorage.removeItem(k));
  } catch { /* noop */ }
};

const Meeting: React.FC = () => {
  const [submitterOpen, setSubmitterOpen] = useState(false);
  const openNewSubmitter = () => { setSubmitterOpen(true); };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingConfirmRef = useRef<(() => void) | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [draftIdToDelete, setDraftIdToDelete] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  /** No status filter on initial load — show all meetings; filtering only when user selects criteria. */
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [view, setView] = useState<ViewType>('cards');

  useEffect(() => {
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  }, [searchValue, statusFilters]);

  const { meetings, isLoading, error, totalPages } = useMeetings({
    searchValue,
    statusFilter: statusFilters.length > 0 ? statusFilters : 'all',
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

  const deleteDraftMutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      clearDraftData();
      setDraftIdToDelete(null);
      setDeleteConfirmOpen(false);
    },
  });

  const onDeleteDraft = useCallback((draftId: string) => {
    setDraftIdToDelete(draftId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (draftIdToDelete) {
      deleteDraftMutation.mutate(draftIdToDelete);
    }
  }, [draftIdToDelete, deleteDraftMutation]);

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
      onDeleteDraft,
      deletingDraftId: deleteDraftMutation.isPending ? draftIdToDelete : null,
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
    onDeleteDraft,
    deleteDraftMutation.isPending,
    draftIdToDelete,
  ]);

  const filterTabs = getMeetingTabsByRole(MeetingOwnerType.SUBMITTER);
  const activeFilterLabel = statusFilters.length > 0
    ? `${statusFilters.length} حالة`
    : 'تصفية الحالة';

  return (
     <>
      <SubmitterModal open={submitterOpen} onOpenChange={setSubmitterOpen} excludeColumns={["access_permission", "is_consultant"]} />
      {/* Confirm Dialog */}
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

      {/* Delete draft confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!open) { setDeleteConfirmOpen(false); setDraftIdToDelete(null); } }}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border border-gray-200/80 bg-white shadow-xl" dir="rtl">
          <DialogHeader className="text-right gap-2">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              حذف المسودة
            </DialogTitle>
            <DialogDescription className="text-right text-base text-gray-600 pt-1">
              هل أنت متأكد من حذف هذه المسودة؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-start sm:justify-start mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDeleteConfirmOpen(false); setDraftIdToDelete(null); }}
              className="min-w-[100px]"
              disabled={deleteDraftMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteDraftMutation.isPending}
            >
              {deleteDraftMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col w-full min-h-0" dir="rtl">

        {/* ════════════════════════════════════════ */}
        {/* PAGE HEADER — Title + Search + Actions  */}
        {/* ════════════════════════════════════════ */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            {/* Right: Title area */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--color-primary-50)]">
                <Icon icon="solar:document-text-bold" width={22} height={22} className="text-[var(--color-primary-500)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-gray-900)]">الطلبات الحالية</h1>
                <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">الاطلاع على الطلبات الحالية</p>
              </div>
            </div>

            {/* Left: Actions */}
            <div className="flex items-center gap-2">
              {/* Status filter dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    'h-10 px-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all',
                    statusFilters.length > 0
                      ? 'bg-[var(--color-primary-50)] border-[var(--color-primary-200)] text-[var(--color-primary-700)]'
                      : 'bg-white border-[var(--color-base-gray-200)] text-[var(--color-text-gray-600)] hover:border-[var(--color-base-gray-300)]'
                  )}>
                    <Filter className="w-4 h-4" />
                    <span>{activeFilterLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2" dir="rtl">
                  <div className="flex flex-col gap-0.5">
                    {filterTabs?.map((tab) => {
                      const isChecked = statusFilters.includes(tab.id);
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setStatusFilters(prev =>
                              isChecked ? prev.filter(s => s !== tab.id) : [...prev, tab.id]
                            );
                          }}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                            isChecked
                              ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                              : 'text-[var(--color-text-gray-600)] hover:bg-[var(--color-base-gray-50)]'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                              isChecked
                                ? 'bg-[var(--color-primary-500)] border-[var(--color-primary-500)]'
                                : 'border-[var(--color-base-gray-300)]'
                            )}>
                              {isChecked && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <span>{tab.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {statusFilters.length > 0 && (
                    <button
                      onClick={() => setStatusFilters([])}
                      className="w-full mt-2 pt-2 border-t border-[var(--color-base-gray-100)] text-xs text-[var(--color-text-gray-500)] hover:text-[var(--color-primary-600)] transition-colors text-center py-1.5"
                    >
                      مسح الكل
                    </button>
                  )}
                </PopoverContent>
              </Popover>

              {/* Active filter chips */}
              {statusFilters.length > 0 && (
                <div className="flex items-center gap-1">
                  {statusFilters.map(id => {
                    const tab = filterTabs.find(t => t.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-medium"
                      >
                        {tab?.label ?? id}
                        <button
                          onClick={() => setStatusFilters(prev => prev.filter(s => s !== id))}
                          className="hover:text-[var(--color-primary-900)] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-gray-500)]" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="بحث..."
                  className="h-10 pr-10 pl-4 rounded-xl bg-white border border-[var(--color-base-gray-200)] text-sm text-[var(--color-text-gray-700)] placeholder:text-[var(--color-text-gray-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]/20 transition-all w-[220px]"
                />
              </div>
              {/* Create meeting button */}
              <button
                onClick={openNewSubmitter}
                className="h-10 px-4 rounded-xl bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء اجتماع</span>
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/*     CONTENT                              */}
        {/* ════════════════════════════════════════ */}
        <div className="flex-1 px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--color-text-gray-600)]">جاري التحميل...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>حدث خطأ أثناء تحميل البيانات</span>
              </div>
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-base-gray-100)] flex items-center justify-center">
                <Inbox className="w-7 h-7 text-[var(--color-text-gray-500)]" />
              </div>
              <p className="text-sm text-[var(--color-text-gray-500)]">لا توجد طلبات</p>
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
                      meeting.status === MeetingStatus.RETURNED_FROM_CONTENT ||
                      meeting.status === MeetingStatus.SCHEDULED_ADDITIONAL_INFO ||
                      meeting.status === MeetingStatus.SCHEDULED_ADDITIONAL_INFO_CONTENT
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
                    if (meeting.status === MeetingStatus.RETURNED_FROM_SCHEDULING || meeting.status === MeetingStatus.SCHEDULED_ADDITIONAL_INFO ) {
                      return isSubmitting && submittingMeetingId === meeting.id ? 'جاري الإرسال...' : 'إحالة للمسؤول';
                    }
                    if (meeting.status === MeetingStatus.RETURNED_FROM_CONTENT || meeting.status === MeetingStatus.SCHEDULED_ADDITIONAL_INFO_CONTENT ) {
                      return isSubmitting && submittingMeetingId === meeting.id ? 'جاري الإرسال...' : 'إحالة للمحتوى';
                    }
                    return undefined;
                  }}
                  getActionLoading={(meeting) => isSubmitting && submittingMeetingId === meeting.id}
                  onSecondaryAction={(meeting) => meeting.status === MeetingStatus.DRAFT && onDeleteDraft(meeting.id)}
                  getSecondaryActionLabel={(meeting) =>
                    meeting.status === MeetingStatus.DRAFT
                      ? (deleteDraftMutation.isPending && draftIdToDelete === meeting.id ? 'جاري الحذف...' : 'حذف')
                      : undefined
                  }
                  getSecondaryActionLoading={(meeting) => deleteDraftMutation.isPending && draftIdToDelete === meeting.id}
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
      </div>
     </>
  );
};

export default Meeting;
