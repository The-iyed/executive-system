import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATH } from '../../../routes/paths';
import { useStep1BasicInfo } from './useStep1BasicInfo';
import { useStep2Content } from './useStep2Content';
import { useStep3Invitees } from './useStep3Invitees';
import { useStep4Scheduling } from './useStep4Scheduling';
import { useDeleteDraft } from './useDeleteDraft';
import type { Step1BasicInfoFormData } from '../schemas/step1BasicInfo.schema';
import type { Step2ContentFormData } from '../schemas/step2Content.schema';
import type { Step3InviteesFormData } from '../schemas/step3Invitees.schema';
import type { Step1SchedulingState } from './useStep1BasicInfo';
import { clearDraftData, getContentStepOptions, saveContentStepOptions } from '../utils';

const STEP_4_INDEX = 3;

interface UseMeetingStepsProps {
  draftId: string | undefined;
  isEditMode: boolean;
  /** Current stepper step (0-based). When not step 4, the calendar fetch in step 4 is disabled. */
  currentStep?: number;
  initialData?: {
    step1BasicInfo?: Partial<Step1BasicInfoFormData>;
    step1Scheduling?: Partial<Step1SchedulingState>;
    step2Content?: Partial<Step2ContentFormData>;
    step3Invitees?: Partial<Step3InviteesFormData>;
    step4Scheduling?: { initialSlots?: string[] };
  };
  onStep1Success?: (newDraftId: string) => void;
  onStep2ContentSuccess?: (isDraft: boolean) => void;
  onStep3InviteesSuccess?: (isDraft: boolean) => void;
  onStep4SchedulingSuccess?: () => void;
}

export const useMeetingSteps = ({
  draftId,
  isEditMode,
  currentStep = 0,
  initialData,
  onStep1Success,
  onStep2ContentSuccess,
  onStep3InviteesSuccess,
  onStep4SchedulingSuccess,
}: UseMeetingStepsProps) => {
  const navigate = useNavigate();

  const deleteDraft = useDeleteDraft({
    draftId: draftId || '',
    onError: (error) => {
      console.error('Delete draft error:', error);
    },
  });

  const step1BasicInfoHook = useStep1BasicInfo({
    draftId,
    initialData: initialData?.step1BasicInfo,
    initialScheduling: initialData?.step1Scheduling,
    onSuccess: onStep1Success,
    onError: (error) => {
      console.error('Step1BasicInfo error:', error);
    },
    isEditMode,
  });

  useEffect(() => {
    if (draftId && step1BasicInfoHook.formData.meetingCategory !== undefined && step1BasicInfoHook.formData.meetingCategory !== '') {
      saveContentStepOptions({
        meetingCategory: step1BasicInfoHook.formData.meetingCategory,
        meetingConfidentiality: step1BasicInfoHook.formData.meetingConfidentiality,
        isUrgent: step1BasicInfoHook.formData.is_urgent === true,
      });
    }
  }, [draftId, step1BasicInfoHook.formData.meetingCategory, step1BasicInfoHook.formData.meetingConfidentiality, step1BasicInfoHook.formData.is_urgent]);

  const contentStepOptions = useMemo(() => {
    const fromStep1 = {
      meetingCategory: step1BasicInfoHook.formData.meetingCategory,
      meetingConfidentiality: step1BasicInfoHook.formData.meetingConfidentiality,
      isUrgent: step1BasicInfoHook.formData.is_urgent === true,
    };
    const hasFromStep1 =
      fromStep1.meetingCategory !== undefined && fromStep1.meetingCategory !== '';
    if (hasFromStep1) return fromStep1;
    const persisted = getContentStepOptions();
    return {
      meetingCategory: persisted?.meetingCategory,
      meetingConfidentiality: persisted?.meetingConfidentiality,
      isUrgent: persisted?.isUrgent ?? false,
    };
  }, [
    step1BasicInfoHook.formData.meetingCategory,
    step1BasicInfoHook.formData.meetingConfidentiality,
    step1BasicInfoHook.formData.is_urgent,
  ]);

  const step2ContentHook = useStep2Content({
    draftId: draftId || '',
    initialData: initialData?.step2Content,
    meetingCategory: contentStepOptions.meetingCategory,
    meetingConfidentiality: contentStepOptions.meetingConfidentiality,
    isUrgent: contentStepOptions.isUrgent,
    onSuccess: onStep2ContentSuccess,
    onError: (error:any) => {
      console.error('Step2Content error:', error);
    },
    isEditMode,
  });

  const step3InviteesHook = useStep3Invitees({
    draftId: draftId || '',
    initialData: initialData?.step3Invitees,
    meetingCategory: contentStepOptions.meetingCategory,
    meetingConfidentiality: contentStepOptions.meetingConfidentiality,
    onSuccess: onStep3InviteesSuccess || (() => {
      clearDraftData();
      navigate(PATH.MEETINGS);
    }), 
    onError: (error) => {
      console.error('Step3Invitees error:', error);
    },
    isEditMode,
  });

  const step4SchedulingHook = useStep4Scheduling({
    draftId: draftId || '',
    initialSlots: initialData?.step4Scheduling?.initialSlots,
    enableCalendarFetch: currentStep === STEP_4_INDEX,
    onSuccess: onStep4SchedulingSuccess || (() => {
      clearDraftData();
      navigate(PATH.MEETINGS);
    }),
    onError: (error) => {
      console.error('Step4Scheduling error:', error);
    },
  });

  return {
    deleteDraft,
    step1BasicInfoHook,
    step2ContentHook,
    step3InviteesHook,
    step4SchedulingHook,
  };
};
