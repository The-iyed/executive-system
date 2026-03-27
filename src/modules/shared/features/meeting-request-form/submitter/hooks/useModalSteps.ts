import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { DynamicTableFormHandle } from "@/lib/dynamic-table-form";
import { useSaveDraftBasicInfo, useSaveDraftContent } from "../../hooks/useDraftMutations";
import { buildStep1FormData } from "../../shared/utils/buildStep1FormData";
import type { SubmitterStep1Values } from "../schema";

interface UseModalStepsOptions {
  editMeetingId?: string | null;
  onClose: () => void;
  onStep1Success?: (draftId: string) => void;
  onStep2Success?: (draftId: string) => void;
}

export function useModalSteps({ editMeetingId, onClose }: UseModalStepsOptions) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<SubmitterStep1Values | null>(null);
  const [draftId, setDraftId] = useState<string | null>(editMeetingId ?? null);
  const inviteesRef = useRef<DynamicTableFormHandle>(null);

  const isEditMode = !!editMeetingId;
  const activeDraftId = editMeetingId || draftId;

  // ── Mutations (step 1 & 2 are shared across roles) ──────────────────────
  const basicInfoMutation = useSaveDraftBasicInfo();
  const contentMutation = useSaveDraftContent();

  // ── Navigation ──────────────────────────────────────────────────────────
  const goToPrevStep = useCallback(() => setCurrentStep((s) => s - 1), []);

  const resetModal = useCallback(() => {
    onClose();
    setCurrentStep(1);
    setStep1Data(null);
    setDraftId(null);
  }, [onClose]);

  const triggerActiveFormSubmit = useCallback(() => {
    const form = document.querySelector<HTMLFormElement>(
      `[data-step="${currentStep}"] form`,
    );
    form?.requestSubmit();
  }, [currentStep]);

  // ── Step 1 ──────────────────────────────────────────────────────────────
  const handleStep1Submit = useCallback(
    (data: SubmitterStep1Values) => {
      const formData = buildStep1FormData(data);

      basicInfoMutation.mutate(
        { formData, draftId },
        {
          onSuccess: (newDraftId) => {
            setDraftId(newDraftId);
            setStep1Data(data);
            setCurrentStep(2);
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "فشل حفظ معلومات الاجتماع"),
        },
      );
    },
    [draftId, basicInfoMutation],
  );

  // ── Step 2 ──────────────────────────────────────────────────────────────
  const handleStep2Submit = useCallback(
    (formData: FormData | null) => {
      if (!formData || !draftId) {
        setCurrentStep(3);
        return;
      }

      contentMutation.mutate(
        { draftId, payload: formData },
        {
          onSuccess: () => setCurrentStep(3),
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "فشل حفظ المحتوى"),
        },
      );
    },
    [draftId, contentMutation],
  );

  return {
    // State
    currentStep,
    step1Data,
    draftId,
    activeDraftId,
    inviteesRef,
    isEditMode,

    // Navigation
    goToPrevStep,
    resetModal,
    triggerActiveFormSubmit,
    setCurrentStep,

    // Step handlers
    handleStep1Submit,
    handleStep2Submit,

    // Pending state (step 1 & 2 only)
    isStepSaving: basicInfoMutation.isPending || contentMutation.isPending,
  };
}
