import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isSubmitterEditBlockedStatus } from '@/modules/shared/types';
import { getDraftById, getSubmitterMeeting } from '../../../data';
import { PATH } from '../../../routes/paths';
import { clearDraftData, transformDraftToStep1Data, transformDraftToStep2ContentData, transformDraftToStep3InviteesData } from '../utils';
import { transformMeetingToInitialData, type MeetingForEdit } from '../utils/transformMeetingToEditData';
import { useStepNavigation } from './useStepNavigation';
import { useStepHandlers } from './useStepHandlers';
import { useMeetingSteps } from './useMeetingSteps';
import { useScrollToTop } from './useScrollToTop';

export interface UseEditMeetingOptions {
  meetingIdOverride?: string;
  /** When opening edit from meeting detail: pass meeting from getMeetingById so form loads with same API data */
  initialMeetingData?: MeetingForEdit | null;
}

export const useEditMeeting = (options?: UseEditMeetingOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: idFromParams } = useParams<{ id: string }>();
  const id = options?.meetingIdOverride ?? idFromParams ?? undefined;
  const fromMeetingDetail = !!options?.initialMeetingData;

  const { data: draftDataFromApi, isLoading: isLoadingDraft, error } = useQuery({
    queryKey: ['draft', id, 'edit'],
    queryFn: () => getDraftById(id!),
    enabled: !!id && !fromMeetingDetail,
  });

  const { data: submitterMeeting } = useQuery({
    queryKey: ['submitterMeeting', id, 'edit'],
    queryFn: () => getSubmitterMeeting(id!),
    enabled: !!id && !fromMeetingDetail,
  });

  const draftData = fromMeetingDetail ? (options!.initialMeetingData ?? null) : draftDataFromApi;
  const isLoading = fromMeetingDetail ? false : isLoadingDraft;

  const submitterStatus = submitterMeeting?.status;
  const underReviewBlocked = useMemo(() => {
    if (fromMeetingDetail && options?.initialMeetingData?.status != null) {
      return isSubmitterEditBlockedStatus(options.initialMeetingData.status as string);
    }
    if (fromMeetingDetail) return false;
    if (!id) return false;
    if (submitterMeeting === undefined) return false;
    return isSubmitterEditBlockedStatus(submitterStatus as string);
  }, [
    options?.initialMeetingData?.status,
    fromMeetingDetail,
    id,
    submitterMeeting,
    submitterStatus,
  ]);

  const editableFields = useMemo(
    () => (fromMeetingDetail ? null : (submitterMeeting?.editable_fields ?? draftDataFromApi?.editable_fields ?? null)),
    [fromMeetingDetail, submitterMeeting?.editable_fields, draftDataFromApi?.editable_fields]
  );

  const initialData = useMemo(() => {
    if (fromMeetingDetail && options?.initialMeetingData) {
      return transformMeetingToInitialData(options.initialMeetingData);
    }
    if (!draftDataFromApi) return undefined;
    return {
      step1BasicInfo: transformDraftToStep1Data(draftDataFromApi),
      step2Content: transformDraftToStep2ContentData(draftDataFromApi),
      step3Invitees: transformDraftToStep3InviteesData(draftDataFromApi),
    };
  }, [fromMeetingDetail, options?.initialMeetingData, draftDataFromApi]);

  const { currentStep, handleNext: baseHandleNext, handlePrevious } = useStepNavigation();

  const scrollContainerRef = useScrollToTop(currentStep);

  const handleNext = useCallback(() => {
    baseHandleNext();
  }, [baseHandleNext]);

  const handleSaveDraft = useCallback(() => {
    clearDraftData();
    navigate(PATH.MEETINGS);
  }, [navigate]);

  const { deleteDraft, step1BasicInfoHook, step2ContentHook, step3InviteesHook } = useMeetingSteps({
    draftId: id ?? '',
    isEditMode: true,
    editableFields,
    initialData,
    onStep2ContentSuccess: (isDraft) => {
      if (isDraft) handleSaveDraft();
      else handleNext();
    },
    onStep3InviteesSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      handleSaveDraft();
    },
  });

  const handleCancel = useCallback(() => {
    deleteDraft.openConfirm();
  }, [deleteDraft]);

  const stepHandlers = useStepHandlers({
    step1BasicInfoHook,
    step2ContentHook,
    step3InviteesHook,
    onNext: handleNext,
    onSaveDraft: handleSaveDraft,
  });

  return {
    currentStep,
    draftId: id ?? '',
    scrollContainerRef,
    deleteDraft,
    step1BasicInfoHook,
    step2ContentHook,
    step3InviteesHook,
    handleNext,
    handlePrevious,
    handleCancel,
    handleSaveDraft,
    isLoading,
    error,
    draftData,
    initialData,
    underReviewBlocked,
    ...stepHandlers,
  };
};