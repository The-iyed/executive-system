import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import type { MeetingCardAction } from '@/modules/shared/features/meeting-list';
import { MeetingStatus, getMeetingStatusLabel } from '@/modules/shared';
import { ConfirmDialog } from '@/modules/shared/components/confirm-dialog';
import { getAssignedSchedulingRequests, type MeetingApiResponse, type GetMeetingsParams } from '../../data/meetingsApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import { PATH } from '../../routes/paths';
import { useDeleteDraft } from './useDeleteDraft';
import { submitDraft } from '@/modules/shared/features/meeting-request-form/api/submitDraft';
import { useToast } from '@/lib/ui';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirmOpen, targetId, isPending, requestDelete, confirmDelete, setConfirmOpen } = useDeleteDraft();

  // Submit draft state
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitTargetId, setSubmitTargetId] = useState<string | null>(null);
  const submitDraftMutation = useMutation({
    mutationFn: (id: string) => submitDraft(id),
    onSuccess: () => {
      toast({ title: 'تم إرسال الطلب للمراجعة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['work-basket', 'uc02'] });
      setSubmitConfirmOpen(false);
    },
    onError: (err) => {
      toast({ title: err instanceof Error ? err.message : 'فشل إرسال الطلب', variant: 'destructive' });
    },
  });

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
        isPending && targetId === item.id ? 'جاري الحذف...' : 'حذف',
      variant: 'danger',
      onClick: (item) => requestDelete(item.id),
      hidden: (item) => item.status !== MeetingStatus.DRAFT,
      loading: (item) => isPending && targetId === item.id,
    },
  ];

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="حذف المسودة"
        description="هل أنت متأكد من حذف هذه المسودة؟"
        confirmLabel="تأكيد الحذف"
        loadingLabel="جاري الحذف..."
        onConfirm={confirmDelete}
        isLoading={isPending}
        variant="danger"
      />

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
