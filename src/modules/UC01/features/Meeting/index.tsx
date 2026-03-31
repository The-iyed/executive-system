import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Plus } from 'lucide-react';
import { MeetingListLayout } from '@/modules/shared/features/meeting-list';
import type { MeetingCardAction, MeetingFilterConfig } from '@/modules/shared/features/meeting-list';
import { MeetingStatus, getMeetingTabsByRole, MeetingOwnerType } from '@/modules/shared';
import { ConfirmDialog } from '@/modules/shared/components/confirm-dialog';
import { getMeetings, type MeetingApiResponse, type GetMeetingsParams } from '../../data/meetingsApi';
import { deleteDraft } from '../../data/draftApi';
import { mapMeetingToCardData } from '@/modules/shared/utils/meetingMapper';
import { useSubmitMeeting } from '../../hooks';
import { PATH } from '../../routes/paths';
import { SubmitterModal } from '@/modules/shared/features/meeting-request-form';

/** Clear draft data from localStorage */
const clearDraftData = () => {
  try {
    Object.keys(localStorage).filter(k => k.startsWith('draft')).forEach(k => localStorage.removeItem(k));
  } catch { /* noop */ }
};

const SUBMITTABLE_STATUSES = new Set([
  MeetingStatus.DRAFT,
  MeetingStatus.RETURNED_FROM_SCHEDULING,
  MeetingStatus.RETURNED_FROM_CONTENT,
  MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
  MeetingStatus.SCHEDULED_ADDITIONAL_INFO_CONTENT,
]);

const Meeting: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitterOpen, setSubmitterOpen] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmVariant, setConfirmVariant] = useState<'danger' | 'info' | 'primary' | 'warning'>('primary');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const pendingConfirmRef = useRef<(() => void) | null>(null);

  const { submitMeeting, isSubmitting, submittingMeetingId } = useSubmitMeeting();

  const deleteDraftMutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      clearDraftData();
      setConfirmOpen(false);
      setConfirmLoading(false);
    },
    onError: () => {
      setConfirmLoading(false);
    },
  });

  // Build status filter config from role tabs
  const filtersConfig: MeetingFilterConfig[] = useMemo(() => {
    const tabs = getMeetingTabsByRole(MeetingOwnerType.SUBMITTER);
    return [
      {
        key: 'status',
        label: 'حالة الطلب',
        type: 'multi-select' as const,
        options: tabs.map(t => ({ value: t.id, label: t.label })),
      },
    ];
  }, []);

  const queryFn = useCallback((params: Record<string, any>) => {
    const apiParams: GetMeetingsParams = {
      skip: params.skip,
      limit: params.limit,
    };
    if (params.search) apiParams.search = params.search;
    // Handle status filter (multi-select array from useMeetingList)
    if (params.status && Array.isArray(params.status) && params.status.length > 0) {
      apiParams.status = params.status;
    }
    return getMeetings(apiParams);
  }, []);

  // Card actions: Submit + Delete
  const cardActions: MeetingCardAction<MeetingApiResponse>[] = useMemo(() => [
    {
      id: 'submit',
      label: (item: MeetingApiResponse) => {
        if (item.status === MeetingStatus.DRAFT) return 'إرسال المسودة';
        if (item.status === MeetingStatus.RETURNED_FROM_SCHEDULING || item.status === MeetingStatus.SCHEDULED_ADDITIONAL_INFO)
          return 'إحالة للمسؤول';
        if (item.status === MeetingStatus.RETURNED_FROM_CONTENT || item.status === MeetingStatus.SCHEDULED_ADDITIONAL_INFO_CONTENT)
          return 'إحالة للمحتوى';
        return 'إرسال';
      },
      variant: 'primary',
      hidden: (item: MeetingApiResponse) => !SUBMITTABLE_STATUSES.has(item.status),
      loading: (item: MeetingApiResponse) => isSubmitting && submittingMeetingId === item.id,
      onClick: (item: MeetingApiResponse) => {
        setConfirmTitle('تأكيد الإرسال');
        setConfirmMessage('هل أنت متأكد من الإرسال؟');
        setConfirmVariant('primary');
        pendingConfirmRef.current = () => {
          submitMeeting({ meetingId: item.id, status: item.status });
          setConfirmOpen(false);
        };
        setConfirmOpen(true);
      },
    },
    {
      id: 'delete',
      label: 'حذف',
      variant: 'danger',
      hidden: (item: MeetingApiResponse) => item.status !== MeetingStatus.DRAFT,
      loading: (item: MeetingApiResponse) => deleteDraftMutation.isPending && deleteDraftMutation.variables === item.id,
      onClick: (item: MeetingApiResponse) => {
        setConfirmTitle('حذف المسودة');
        setConfirmMessage('هل أنت متأكد من حذف هذه المسودة؟');
        setConfirmVariant('danger');
        pendingConfirmRef.current = () => {
          setConfirmLoading(true);
          deleteDraftMutation.mutate(item.id);
        };
        setConfirmOpen(true);
      },
    },
  ], [isSubmitting, submittingMeetingId, deleteDraftMutation, submitMeeting]);

  const handleConfirm = useCallback(() => {
    pendingConfirmRef.current?.();
  }, []);

  const handleConfirmClose = useCallback(() => {
    setConfirmOpen(false);
    pendingConfirmRef.current = null;
    setConfirmLoading(false);
  }, []);

  const headerRight = useMemo(() => (
    <button
      onClick={() => setSubmitterOpen(true)}
      className="h-10 px-4 rounded-xl bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
    >
      <Plus className="w-4 h-4" />
      <span>إنشاء اجتماع</span>
    </button>
  ), []);

  return (
    <>
      <SubmitterModal open={submitterOpen} onOpenChange={setSubmitterOpen} excludeColumns={["access_permission", "is_consultant"]} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => { if (!open) handleConfirmClose(); }}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel={confirmVariant === 'danger' ? 'تأكيد الحذف' : 'تأكيد'}
        cancelLabel="إلغاء"
        variant={confirmVariant}
        isLoading={confirmLoading}
        onConfirm={handleConfirm}
      />

      <MeetingListLayout<MeetingApiResponse>
        title="الطلبات الحالية"
        description="الاطلاع على الطلبات الحالية"
        headerIcon="solar:document-text-bold"
        headerRight={headerRight}
        queryKey={['meetings', 'uc01']}
        queryFn={queryFn}
        mapToCard={mapMeetingToCardData}
        cardActions={cardActions}
        filtersConfig={filtersConfig}
        pageSize={6}
        onCardClick={(item) => navigate(PATH.MEETING_PREVIEW.replace(':id', item.id))}
        searchPlaceholder="بحث..."
        emptyMessage="لا توجد طلبات"
      />
    </>
  );
};

export default Meeting;
