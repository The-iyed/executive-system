import { useCallback } from 'react';

interface Step1BasicInfoHook {
  submitStep: (isDraft: boolean) => Promise<string | null>;
}
interface Step2ContentHook {
  submitStep: (isDraft: boolean) => void;
}
interface Step3InviteesHook {
  submitStep: (isDraft: boolean) => void;
}
interface UseStepHandlersProps {
  step1BasicInfoHook: Step1BasicInfoHook;
  step2ContentHook: Step2ContentHook;
  step3InviteesHook: Step3InviteesHook;
  onNext: (newDraftId?: string) => void | string | undefined;
  onSaveDraft: () => void;
}

export const useStepHandlers = ({
  step1BasicInfoHook,
  step2ContentHook,
  step3InviteesHook,
  onNext,
  onSaveDraft,
}: UseStepHandlersProps) => {
  const handleStep1BasicInfoNext = useCallback(async () => {
    try {
      const newDraftId = await step1BasicInfoHook.submitStep(false);
      if (newDraftId) {
        onNext(newDraftId);
      }
    } catch (error) {
      console.error('Error submitting step 1 (Basic Info):', error);
    }
  }, [step1BasicInfoHook, onNext]);

  const handleStep1BasicInfoSaveDraft = useCallback(async () => {
    try {
      const newDraftId = await step1BasicInfoHook.submitStep(true);
      if (newDraftId) {
        onSaveDraft();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [step1BasicInfoHook, onSaveDraft]);

  const handleStep2ContentNext = useCallback(() => {
    step2ContentHook.submitStep(false);
  }, [step2ContentHook]);

  const handleStep2ContentSaveDraft = useCallback(() => {
    step2ContentHook.submitStep(true);
  }, [step2ContentHook]);

  const handleStep3InviteesNext = useCallback(() => {
    step3InviteesHook.submitStep(false);
  }, [step3InviteesHook]);

  const handleStep3InviteesSaveDraft = useCallback(() => {
    step3InviteesHook.submitStep(true);
  }, [step3InviteesHook]);

  return {
    handleStep1BasicInfoNext,
    handleStep1BasicInfoSaveDraft,
    handleStep2ContentNext,
    handleStep2ContentSaveDraft,
    handleStep3InviteesNext,
    handleStep3InviteesSaveDraft,
  };
};
