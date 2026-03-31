import { useState, useRef, useCallback, useEffect } from "react";
import { DynamicTableFormHandle } from "@/lib/dynamic-table-form";
import type { SubmitterStep1Values } from "../schema";

interface UseModalStepsOptions {
  open: boolean;
  editMeetingId?: string | null;
}

export function useModalSteps({ open, editMeetingId }: UseModalStepsOptions) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<SubmitterStep1Values | null>(null);
  const [step2Data, setStep2Data] = useState<FormData | null>(null);
  const [draftId, setDraftId] = useState<string | null>(editMeetingId ?? null);
  const inviteesRef = useRef<DynamicTableFormHandle>(null);

  // Rehydrate state every time the modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setStep1Data(null);
      setStep2Data(null);
      setDraftId(editMeetingId ?? null);
    }
  }, [open, editMeetingId]);

  const isEditMode = !!editMeetingId;
  const activeDraftId = editMeetingId || draftId;

  // ── Navigation ──────────────────────────────────────────────────────────
  const goToPrevStep = useCallback(() => setCurrentStep((s) => s - 1), []);

  const resetModal = useCallback(() => {
    setCurrentStep(1);
    setStep1Data(null);
    setStep2Data(null);
    setDraftId(null);
  }, []);

  const triggerActiveFormSubmit = useCallback(() => {
    const form = document.querySelector<HTMLFormElement>(
      `[data-step="${currentStep}"] form`,
    );
    form?.requestSubmit();
  }, [currentStep]);

  // ── Step 1 (navigation only — no API call) ─────────────────────────────
  const handleStep1Submit = useCallback((data: SubmitterStep1Values) => {
    setStep1Data(data);
    setCurrentStep(2);
  }, []);

  // ── Step 2 (navigation only — no API call) ─────────────────────────────
  const handleStep2Submit = useCallback((formData: FormData | null) => {
    setStep2Data(formData);
    setCurrentStep(3);
  }, []);

  return {
    // State
    currentStep,
    step1Data,
    step2Data,
    draftId,
    setDraftId,
    activeDraftId,
    inviteesRef,
    isEditMode,

    // Navigation
    goToPrevStep,
    resetModal,
    triggerActiveFormSubmit,
    setCurrentStep,

    // Step handlers (navigation only)
    handleStep1Submit,
    handleStep2Submit,
  };
}
