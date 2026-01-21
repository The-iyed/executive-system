import { useNavigate } from 'react-router-dom';
import { PATH } from '../../../routes/paths';
import { useStep1 } from './useStep1';
import { useStep2 } from './useStep2';
import { useStep3 } from './useStep3';
import { useDeleteDraft } from './useDeleteDraft';
import type { Step1FormData } from '../schemas/step1.schema';
import type { Step2FormData } from '../schemas/step2.schema';
import { clearDraftData } from '../utils';

interface UseMeetingStepsProps {
  draftId: string | undefined;
  isEditMode: boolean;
  initialData?: {
    step1?: Partial<Step1FormData>;
    step2?: Partial<Step2FormData>;
    step3?: { initialSlots?: string[] };
  };
  onStep1Success?: (newDraftId: string) => void;
  onStep2Success?: (isDraft: boolean) => void;
  onStep3Success?: () => void;
}

export const useMeetingSteps = ({
  draftId,
  isEditMode,
  initialData,
  onStep1Success,
  onStep2Success,
  onStep3Success,
}: UseMeetingStepsProps) => {
  const navigate = useNavigate();

  const deleteDraft = useDeleteDraft({
    draftId: draftId || '',
    onError: (error) => {
      console.error('Delete draft error:', error);
    },
  });

  const step1Hook = useStep1({
    draftId,
    initialData: initialData?.step1,
    onSuccess: onStep1Success,
    onError: (error) => {
      console.error('Step1 error:', error);
    },
    isEditMode,
  });

  const step2Hook = useStep2({
    draftId: draftId || '',
    initialData: initialData?.step2,
    onSuccess: onStep2Success || ((isDraft) => {
      if (isDraft) {
        navigate(PATH.MEETINGS);
      }
    }),
    onError: (error) => {
      console.error('Step2 error:', error);
    },
    isEditMode,
  });

  const step3Hook = useStep3({
    draftId: draftId || '',
    initialSlots: initialData?.step3?.initialSlots,
    onSuccess: onStep3Success || (() => {
      clearDraftData();
      navigate(PATH.MEETINGS);
    }),
    onError: (error) => {
      console.error('Step3 error:', error);
    },
  });

  return {
    deleteDraft,
    step1Hook,
    step2Hook,
    step3Hook,
  };
};
