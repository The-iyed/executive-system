import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// import { getDraftById } from '../../../data';
import { PATH as UC02_PATH } from '../../../../UC02/routes/paths';
import { clearDraftData, transformDraftToStep1Data, transformDraftToStep2Data, transformDraftToStep3Data } from '../utils';
import { useStepNavigation } from './useStepNavigation';
import { useStepHandlers } from './useStepHandlers';
import { useMeetingSteps } from './useMeetingSteps';
import { useScrollToTop } from './useScrollToTop';
import { getDraftById } from '../../../data';

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
      step1: transformDraftToStep1Data(draftData),
      step2: transformDraftToStep2Data(draftData),
      step3: transformDraftToStep3Data(draftData),
    };
  }, [draftData]);

  const { currentStep, handleNext: baseHandleNext, handlePrevious } = useStepNavigation();

  const scrollContainerRef = useScrollToTop(currentStep);

  const handleNext = useCallback(() => {
    baseHandleNext();
  }, [baseHandleNext]);

  const handleSaveDraft = useCallback(() => {
    clearDraftData();
    navigate(UC02_PATH.DIRECTIVES);
  }, [navigate]);

  const { deleteDraft, step1Hook, step2Hook, step3Hook } = useMeetingSteps({
    draftId: id ?? '',
    isEditMode: true,
    initialData,
    onStep2Success: (isDraft) => {
      if (isDraft) {
        handleSaveDraft();
      }
    },
    onStep2SuccessGoToStep3: handleNext,
    // onStep3Success: () => {
    //   clearDraftData();
    // },
  });

  const handleCancel = useCallback(() => {
    deleteDraft.openConfirm();
  }, [deleteDraft]);

  const stepHandlers = useStepHandlers({
    step1Hook,
    step2Hook,
    step3Hook,
    onNext: handleNext,
    onSaveDraft: handleSaveDraft,
    navigate,
  });

  return {
    currentStep,
    draftId: id ?? '',
    scrollContainerRef,
    deleteDraft,
    step1Hook,
    step2Hook,
    step3Hook,
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
