import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDraftById } from '../../../data';
import { PATH } from '../../../routes/paths';
import { clearDraftData, transformDraftToStep1Data, transformDraftToStep2ContentData, transformDraftToStep3InviteesData, transformDraftToStep4SchedulingData } from '../utils';
import { useStepNavigation } from './useStepNavigation';
import { useStepHandlers } from './useStepHandlers';
import { useMeetingSteps } from './useMeetingSteps';
import { useScrollToTop } from './useScrollToTop';

export interface UseEditMeetingOptions {
  meetingIdOverride?: string;
}

export const useEditMeeting = (options?: UseEditMeetingOptions) => {
  const navigate = useNavigate();
  const { id: idFromParams } = useParams<{ id: string }>();
  const id = options?.meetingIdOverride ?? idFromParams ?? undefined;

  const { data: draftData, isLoading, error } = useQuery({
    queryKey: ['draft', id, 'edit'],
    queryFn: () => getDraftById(id!),
    enabled: !!id,
  });

  const initialData = useMemo(() => {
    if (!draftData) return undefined;
    return {
      step1BasicInfo: transformDraftToStep1Data(draftData),
      step2Content: transformDraftToStep2ContentData(draftData),
      step3Invitees: transformDraftToStep3InviteesData(draftData),
      step4Scheduling: { initialSlots: transformDraftToStep4SchedulingData(draftData) },
    };
  }, [draftData]);

  const { currentStep, handleNext: baseHandleNext, handlePrevious } = useStepNavigation();

  const scrollContainerRef = useScrollToTop(currentStep);

  const handleNext = useCallback(() => {
    baseHandleNext();
  }, [baseHandleNext]);

  const handleSaveDraft = useCallback(() => {
    clearDraftData();
    navigate(PATH.MEETINGS);
  }, [navigate]);

  const { deleteDraft, step1BasicInfoHook, step2ContentHook, step3InviteesHook, step4SchedulingHook } = useMeetingSteps({
    draftId: id ?? '',
    isEditMode: true,
    currentStep,
    editableFields: draftData?.editable_fields ?? null,
    initialData,
    onStep2ContentSuccess: (isDraft) => {
      if (isDraft) handleSaveDraft();
      else handleNext();
    },
    onStep3InviteesSuccess: () => {
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
    step4SchedulingHook,
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
    step4SchedulingHook,
    handleNext,
    handlePrevious,
    handleCancel,
    handleSaveDraft,
    isLoading,
    error,
    draftData,
    initialData,
    ...stepHandlers,
  };
};