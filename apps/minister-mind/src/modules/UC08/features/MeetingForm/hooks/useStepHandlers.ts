import { useCallback } from 'react';
import { PATH } from '../../../routes/paths';

interface Step1Hook {
  submitStep: (isDraft: boolean) => Promise<string | null>;
}

interface Step2Hook {
  submitStep: (isDraft: boolean) => void;
}

interface Step3Hook {
  submitStep: (isDraft: boolean, slots: string[]) => Promise<void>;
  selectedSlots: string[];
}

interface UseStepHandlersProps {
  step1Hook: Step1Hook;
  step2Hook: Step2Hook;
  step3Hook: Step3Hook;
  onNext: (newDraftId?: string) => void | string | undefined;
  onSaveDraft: () => void;
  navigate: (path: string) => void;
}

export const useStepHandlers = ({
  step1Hook,
  step2Hook,
  step3Hook,
  onNext,
  onSaveDraft,
  navigate,
}: UseStepHandlersProps) => {
  const handleStep1Next = useCallback(async () => {
    try {
      const newDraftId = await step1Hook.submitStep(false);
      if (newDraftId) {
        onNext(newDraftId);
      }
    } catch (error) {
      console.error('Error submitting step 1:', error);
    }
  }, [step1Hook, onNext]);

  const handleStep1SaveDraft = useCallback(async () => {
    try {
      const newDraftId = await step1Hook.submitStep(true);
      if (newDraftId) {
        onSaveDraft();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [step1Hook, onSaveDraft]);

  const handleStep2Next = useCallback(() => {
    step2Hook.submitStep(false);
  }, [step2Hook]);

  const handleStep2SaveDraft = useCallback(() => {
    step2Hook.submitStep(true);
  }, [step2Hook]);

  const handleStep3Next = useCallback(async () => {
    await step3Hook.submitStep(false, step3Hook.selectedSlots);
  }, [step3Hook]);

  const handleStep3SaveDraft = useCallback(async () => {
    await step3Hook.submitStep(true, step3Hook.selectedSlots);
    if (step3Hook.selectedSlots.length === 0) {
      navigate(PATH.NEW_MEETING);
    }
  }, [step3Hook, navigate]);

  return {
    handleStep1Next,
    handleStep1SaveDraft,
    handleStep2Next,
    handleStep2SaveDraft,
    handleStep3Next,
    handleStep3SaveDraft,
  };
};
