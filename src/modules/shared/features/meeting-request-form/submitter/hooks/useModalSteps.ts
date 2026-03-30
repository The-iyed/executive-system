import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DynamicTableFormHandle } from "@/lib/dynamic-table-form";
import { useSaveDraftBasicInfo, useSaveDraftContent } from "../../hooks/useDraftMutations";
import { buildStep1FormData } from "../../shared/utils/buildStep1FormData";
import { optimisticMergeMeeting, buildStep1Patch, buildStep2Patch } from "../../shared/utils/optimisticCacheUpdate";
import type { SubmitterStep1Values } from "../schema";

interface UseModalStepsOptions {
  editMeetingId?: string | null;
  onClose: () => void;
  onStepSaved?: (draftId: string) => void;
}

export function useModalSteps({ editMeetingId, onClose, onStepSaved }: UseModalStepsOptions) {
  const queryClient = useQueryClient();
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
    async (data: SubmitterStep1Values) => {
      const formData = buildStep1FormData(data);

      basicInfoMutation.mutate(
        { formData, draftId },
        {
          onSuccess: async (newDraftId) => {
            setDraftId(newDraftId);
            setStep1Data(data);

            // Optimistic cache update for step 1 fields
            if (isEditMode && newDraftId) {
              const patch = buildStep1Patch(data as unknown as Record<string, unknown>);
              optimisticMergeMeeting(queryClient, newDraftId, patch);
            }

            await onStepSaved?.(newDraftId);
            setCurrentStep(2);
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "فشل حفظ معلومات الاجتماع"),
        },
      );
    },
    [draftId, basicInfoMutation, isEditMode, queryClient],
  );

  // ── Step 2 ──────────────────────────────────────────────────────────────
  const handleStep2Submit = useCallback(
    async (formData: FormData | null) => {
      if (!formData || !draftId) {
        setCurrentStep(3);
        return;
      }

      contentMutation.mutate(
        { draftId, payload: formData },
        {
          onSuccess: async () => {
            // Optimistic cache update for step 2 fields
            if (isEditMode && draftId) {
              const patch = buildStep2Patch(formData);
              optimisticMergeMeeting(queryClient, draftId, patch);
            }

            if (draftId) await onStepSaved?.(draftId);
            setCurrentStep(3);
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "فشل حفظ المحتوى"),
        },
      );
    },
    [draftId, contentMutation, isEditMode, queryClient],
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
