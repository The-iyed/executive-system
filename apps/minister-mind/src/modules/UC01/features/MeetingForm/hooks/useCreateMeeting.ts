import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PATH } from '../../../routes/paths';
import { getDraftById } from '../../../data';
import {
  getDraftId,
  saveDraftId,
  clearDraftData,
  STEP_LABELS,
  transformDraftToStep1Data,
  transformDraftToStep2ContentData,
  transformDraftToStep3InviteesData,
  transformDraftToStep4SchedulingData,
} from '../utils';
import { useStepNavigation } from './useStepNavigation';
import { useStepHandlers } from './useStepHandlers';
import { useMeetingSteps } from './useMeetingSteps';
import { useScrollToTop } from './useScrollToTop';

export const useCreateMeeting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isNewMeeting = new URLSearchParams(location.search).get('new') === 'true' || 
                       location.state?.isNewMeeting === true;

  const [draftId, setDraftId] = useState<string | undefined>(() => {
    if (isNewMeeting) return undefined;
    return getDraftId();
  });

  const { data: draftData } = useQuery({
    queryKey: ['draft', draftId, 'create-hydrate'],
    queryFn: () => getDraftById(draftId!),
    enabled: !!draftId,
  });

  const initialDataFromDraft = useMemo(() => {
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
    navigate(PATH.MEETINGS);
  }, [navigate]);

  const { deleteDraft, step1BasicInfoHook, step2ContentHook, step3InviteesHook, step4SchedulingHook } = useMeetingSteps({
    draftId,
    isEditMode: false,
    currentStep,
    initialData: initialDataFromDraft,
    onStep1Success: (newDraftId) => {
      setDraftId(newDraftId);
    },
    onStep2ContentSuccess: (isDraft) => {
      if (isDraft) handleSaveDraft();
      else handleNext();
    },
    onStep3InviteesSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      clearDraftData();
      navigate(PATH.MEETINGS);
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
    draftId,
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
    ...stepHandlers,
  };
};
