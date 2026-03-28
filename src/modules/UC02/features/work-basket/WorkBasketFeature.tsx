import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import type { MeetingCardAction } from '@/modules/shared/features/meeting-list';
import { MeetingStatus, getMeetingStatusLabel } from '@/modules/shared';
import { getAssignedSchedulingRequests, type MeetingApiResponse, type GetMeetingsParams } from '../../data/meetingsApi';
import { deleteDraft } from '../../data/draftApi';
import { mapMeetingToCardData } from '../../utils/meetingMapper';
import { PATH } from '../../routes/paths';
import { trackEvent } from '@/lib/analytics';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, Button } from '@/lib/ui';

const WORK_BASKET_STATUS_OPTIONS: string[] = [
  MeetingStatus.DRAFT,
  MeetingStatus.UNDER_REVIEW,
  MeetingStatus.UNDER_GUIDANCE,
  MeetingStatus.UNDER_CONTENT_REVIEW,
  MeetingStatus.SCHEDULED,
  MeetingStatus.SCHEDULED_SCHEDULING,
  MeetingStatus.SCHEDULED_CONTENT,
  MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
  MeetingStatus.SCHEDULED_DELAYED,
  MeetingStatus.SCHEDULED_DELEGATED,
  MeetingStatus.RETURNED_FROM_SCHEDULING,
  MeetingStatus.RETURNED_FROM_CONTENT,
  MeetingStatus.WAITING,
  MeetingStatus.REJECTED,
  MeetingStatus.CANCELLED,
  MeetingStatus.CLOSED,
  MeetingStatus.CLOSED_PASS,
];

const WorkBasketFeature: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [draftIdToDelete, setDraftIdToDelete] = useState<string | null>(null);

  const deleteDraftMutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-basket'] });
      setDraftIdToDelete(null);
      setDeleteConfirmOpen(false);
    },
  });

  const onDeleteDraft = useCallback((item: MeetingApiResponse) => {
    setDraftIdToDelete(item.id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (draftIdToDelete) {
      deleteDraftMutation.mutate(draftIdToDelete);
    }
  }, [draftIdToDelete, deleteDraftMutation]);

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetMeetingsParams = {
      skip: params.skip,
      limit: params.limit,
    };
    if (params.search) apiParams.search = params.search;
    if (params.status_in?.length) apiParams.status_in = params.status_in;
    return getAssignedSchedulingRequests(apiParams);
  }, []);

  const cardActions: MeetingCardAction<MeetingApiResponse>[] = [
    {
      id: 'delete-draft',
      label: (item) =>
        deleteDraftMutation.isPending && draftIdToDelete === item.id
          ? 'جاري الحذف...'
          : 'حذف',
      variant: 'danger',
      onClick: onDeleteDraft,
      hidden: (item) => item.status !== MeetingStatus.DRAFT,
      loading: (item) => deleteDraftMutation.isPending && draftIdToDelete === item.id,
    },
  ];

  return (
    <>
      {/* Delete confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmOpen(false);
            setDraftIdToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] rounded-xl border border-gray-200/80 bg-white shadow-xl" dir="rtl">
          <DialogHeader className="text-right gap-2">
            <DialogTitle className="text-xl font-semibold text-gray-900">حذف المسودة</DialogTitle>
            <DialogDescription className="text-right text-base text-gray-600 pt-1">
              هل أنت متأكد من حذف هذه المسودة؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-start sm:justify-start mt-6">
            <Button
              variant="outline"
              onClick={() => { setDeleteConfirmOpen(false); setDraftIdToDelete(null); }}
              className="min-w-[100px]"
              disabled={deleteDraftMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteDraftMutation.isPending}
            >
              {deleteDraftMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MeetingListLayout<MeetingApiResponse>
        title="سلة العمل"
        description="إدارة ومتابعة الطلبات المسندة إليك"
        headerIcon="solar:inbox-bold"
        queryKey={['work-basket', 'uc02']}
        queryFn={queryFn}
        mapToCard={mapMeetingToCardData}
        onCardClick={(item) => navigate(PATH.MEETING_DETAIL.replace(':id', item.id))}
        cardActions={cardActions}
        searchPlaceholder="بحث في الطلبات..."
        emptyMessage="لا توجد طلبات"
        filtersConfig={[
          {
            key: 'status_in',
            label: 'تصفية الحالة',
            type: 'multi-select',
            options: WORK_BASKET_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: getMeetingStatusLabel(s),
            })),
          },
        ]}
        
      />
    </>
  );
};

export default WorkBasketFeature;
