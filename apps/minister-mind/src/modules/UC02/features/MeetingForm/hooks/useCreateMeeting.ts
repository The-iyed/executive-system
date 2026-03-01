import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getDraftId,
  saveDraftId,
  clearDraftData,
  STEP_LABELS,
} from '../utils';
import { useStepNavigation } from './useStepNavigation';
import { useStepHandlers } from './useStepHandlers';
import { useMeetingSteps } from './useMeetingSteps';
import { useScrollToTop } from './useScrollToTop';
import { PATH } from '../../../routes/paths';

export interface UseCreateMeetingOptions {
  /** When set (e.g. drawer mode), cancel/close closes drawer instead of navigating to MEETINGS */
  onClose?: () => void;
}

export const useCreateMeeting = (options: UseCreateMeetingOptions = {}) => {
  const { onClose } = options;
  const navigate = useNavigate();
  const location = useLocation();

  const isNewMeeting = new URLSearchParams(location.search).get('new') === 'true' || 
                       location.state?.isNewMeeting === true;

  const [draftId, setDraftId] = useState<string | undefined>(() => {
    if (isNewMeeting) return undefined;
    return getDraftId();
  });

  const { currentStep, handleNext: baseHandleNext, handlePrevious } = useStepNavigation();

  const scrollContainerRef = useScrollToTop(currentStep);

  useEffect(() => {
    saveDraftId(draftId);
  }, [draftId]);

  const handleNext = useCallback((newDraftId?: string) => {
    if (newDraftId) {
      setDraftId(newDraftId);
    }
    if (currentStep < STEP_LABELS.length - 1) {
      baseHandleNext();
    } else {
      clearDraftData();
    }
  }, [currentStep, baseHandleNext]);

  const handleSaveDraft = useCallback(() => {
    clearDraftData();
    if (onClose) {
      onClose();
    } else {
      navigate(PATH.DIRECTIVES);
    }
  }, [navigate, onClose]);

  const { deleteDraft, step1Hook, step2Hook, step3Hook } = useMeetingSteps({
    draftId,
    isEditMode: false,
    onStep1Success: (newDraftId) => {
      setDraftId(newDraftId);
    },
    onStep2Success: (isDraft) => {
      if (isDraft) {
        handleSaveDraft();
      }
    },
    onStep2SuccessGoToStep3: handleNext,
    onClose,
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
    draftId,
    scrollContainerRef,
    deleteDraft,
    step1Hook,
    step2Hook,
    step3Hook,
    handleNext,
    handlePrevious,
    handleCancel,
    handleSaveDraft,
    ...stepHandlers,
  };
};