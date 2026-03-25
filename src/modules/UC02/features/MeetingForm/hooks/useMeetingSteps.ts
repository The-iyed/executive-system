import { useNavigate } from 'react-router-dom';
import { PATH as UC02_PATH } from '../../../../UC02/routes/paths';
import { useStep1 } from './useStep1';
import { trackEvent } from '@/lib/analytics';
import { useStep2 } from './useStep2';
import { useStep3 } from './useStep3';
import { useDeleteDraft } from './useDeleteDraft';
import type { Step1FormData } from '../schemas/step1.schema';
import type { Step2FormData } from '../schemas/step2.schema';
import type { Step3FormData } from '../schemas/step3.schema';
import { clearDraftData } from '../utils';

interface UseMeetingStepsProps {
  draftId: string | undefined;
  isEditMode: boolean;
  initialData?: {
    step1?: Partial<Step1FormData>;
    step2?: Partial<Step2FormData>;
    step3?: Partial<Step3FormData>;
  };
  onStep1Success?: (newDraftId: string) => void;
  onStep2Success?: (isDraft: boolean) => void;
  onStep2SuccessGoToStep3?: () => void;
  onStep3Success?: (isDraft?: boolean) => void;
  onClose?: () => void;
}

export const useMeetingSteps = ({
  draftId,
  isEditMode,
  initialData,
  onStep1Success,
  onStep2Success,
  onStep2SuccessGoToStep3,
  onStep3Success,
  onClose,
}: UseMeetingStepsProps) => {
  const navigate = useNavigate();

  const deleteDraft = useDeleteDraft({
    draftId: draftId || '',
    onError: (error) => {
      console.error('Delete draft error:', error);
    },
    onClose,
  });

  const step1Hook = useStep1({
    draftId,
    initialData: initialData?.step1,
    onSuccess: onStep1Success,
    onError: (error) => {
      console.error('Step1 error:', error);
    },
    isEditMode: isEditMode || !!draftId,
  });

  const step2Hook = useStep2({
    draftId: draftId || '',
    initialData: initialData?.step2,
    step1FormData: step1Hook.formData,
    onSuccess: (isDraft) => {
      onStep2Success?.(isDraft);
      if (!isDraft) {
        onStep2SuccessGoToStep3?.();
      } else if (!onStep2Success) {
        navigate(UC02_PATH.DIRECTIVES);
      }
    },
    onError: (error) => {
      console.error('Step2 error:', error);
    },
    isEditMode,
    isNewMeeting: true,
    presentationRequiredOptional: true,
  });

  const wrappedOnStep3Success = (isDraft: boolean) => {
    if (!isDraft) {
      if (isEditMode) {
        trackEvent('UC-02', 'uc02_meeting_edited', { draft_id: draftId });
      } else {
        trackEvent('UC-02', 'uc02_meeting_created_from_directives', { draft_id: draftId });
      }
    }
    (onStep3Success || (() => {
      clearDraftData();
      navigate(UC02_PATH.DIRECTIVES);
    }))(isDraft);
  };

  const step3Hook = useStep3({
    draftId: draftId || '',
    initialData: initialData?.step3,
    step1FormData: step1Hook.formData,
    onSuccess: wrappedOnStep3Success,
    onError: (error) => {
      console.error('Step3 error:', error);
    },
    isEditMode,
  });

  return {
    deleteDraft,
    step1Hook,
    step2Hook,
    step3Hook,
  };
};
