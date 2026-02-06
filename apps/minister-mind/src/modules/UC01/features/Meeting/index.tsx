import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { useToast, Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, Button } from '@sanad-ai/ui';
import { Send } from 'lucide-react';
import { Tabs, DataTable, CardsGrid, ViewSwitcher, SearchInput, ViewType, Pagination, MeetingStatus } from '@shared';
import { MEETING_TABS, PAGINATION, createTableColumns, MEETING_ACTION_CONFIRM_MESSAGE, MEETING_ACTION_CONFIRM_TITLE } from '../../utils';
import { useMeetings } from '../../hooks';
import { submitDraft, resubmitToScheduling, resubmitToContent } from '../../data/draftApi';
import { PATH } from '../../routes/paths';
import '@shared/styles';

const MEETING_ACTION_SUCCESS_MESSAGE = 'تم الإرسال بنجاح';

const Meeting: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingConfirmRef = useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = useState<MeetingStatus>(MeetingStatus.DRAFT);
  const [view, setView] = useState<ViewType>('table');
  const [searchValue, setSearchValue] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);

  useEffect(() => {
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  }, [searchValue, activeTab, statusFilter]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as MeetingStatus);
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
    setStatusFilter('all');
  };

  const { meetings, isLoading, error, totalPages } = useMeetings({
    activeTab,
    searchValue,
    statusFilter,
    currentPage,
  });

  const submitDraftMutation = useMutation({
    mutationFn: submitDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      toast({ title: MEETING_ACTION_SUCCESS_MESSAGE });
    },
    onError: (err) => {
      console.error('Submit draft error:', err);
    },
  });

  const resubmitToSchedulingMutation = useMutation({
    mutationFn: resubmitToScheduling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      toast({ title: MEETING_ACTION_SUCCESS_MESSAGE });
    },
    onError: (err) => {
      console.error('Resubmit to scheduling error:', err);
    },
  });

  const resubmitToContentMutation = useMutation({
    mutationFn: resubmitToContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      toast({ title: MEETING_ACTION_SUCCESS_MESSAGE });
    },
    onError: (err) => {
      console.error('Resubmit to content error:', err);
    },
  });

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
      onSubmitDraft: submitDraftMutation.mutate,
      submittingDraftId: submitDraftMutation.isPending && submitDraftMutation.variables !== undefined ? submitDraftMutation.variables : null,
      onResubmitToScheduling: resubmitToSchedulingMutation.mutate,
      submittingResubmitToSchedulingId: resubmitToSchedulingMutation.isPending && resubmitToSchedulingMutation.variables !== undefined ? resubmitToSchedulingMutation.variables : null,
      onResubmitToContent: resubmitToContentMutation.mutate,
      submittingResubmitToContentId: resubmitToContentMutation.isPending && resubmitToContentMutation.variables !== undefined ? resubmitToContentMutation.variables : null,
      openConfirmModal,
    });
  }, [
    navigate,
    currentPage,
    submitDraftMutation.mutate,
    submitDraftMutation.isPending,
    submitDraftMutation.variables,
    resubmitToSchedulingMutation.mutate,
    resubmitToSchedulingMutation.isPending,
    resubmitToSchedulingMutation.variables,
    resubmitToContentMutation.mutate,
    resubmitToContentMutation.isPending,
    resubmitToContentMutation.variables,
    openConfirmModal,
  ]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
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
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        <div className="flex flex-row items-center justify-between mb-8">
          <Tabs
            items={MEETING_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <div className="pl-4">
            <ViewSwitcher view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Page Title, Description, and Search/Filter Bar */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6">
          {/* Left side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right text-gray-900">
            قائمة الاجتماعات
            </h1>
            <p className="text-base text-gray-600 text-right">
            يمكنك الاطلاع على الاجتماعات التي قمت بإنشائها.
            </p>
          </div>
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                variant="default"
              />
        </div>

        <div className="mt-4">
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
                <div className="w-full overflow-x-auto table-scroll">
                  <div className="min-w-[1400px]">
                    <DataTable
                      columns={tableColumns}
                      data={meetings}
                      onRowClick={(row) =>
                        navigate(PATH.MEETING_PREVIEW.replace(':id', row.id))
                      }
                    />
                  </div>
                </div>
              ) : (
                <CardsGrid
                  meetings={meetings}
                  onView={(meeting) => navigate(PATH.MEETING_PREVIEW.replace(':id', meeting.id))}
                  onDetails={(meeting) => navigate(PATH.MEETING_PREVIEW.replace(':id', meeting.id))}
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
    </div>
  );
};

export default Meeting;