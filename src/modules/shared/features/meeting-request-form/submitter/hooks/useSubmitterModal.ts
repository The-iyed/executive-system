import { useState, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useMeetingDraft } from "../../shared/hooks/useMeetingDraft";
import {
  useSaveDraftBasicInfo,
  useSaveDraftContent,
  useSaveDraftInvitees,
  useSubmitDraft,
  useResubmitToScheduling,
  useResubmitToContent,
} from "../../hooks/useDraftMutations";
import { MeetingStatus, SAVEABLE_DRAFT_STATUSES } from "../../types";
import { mapMeetingToSubmitterStep1, transformDraftToInvitees, transformDraftToStep2ContentData } from "../utils/mappers";
import { buildStep1FormData } from "../utils/buildStep1FormData";
import type { DynamicTableFormHandle } from "@/lib/dynamic-table-form";
import type { SubmitterStep1Values } from "../schema";

interface UseSubmitterModalOptions {
  editMeetingId?: string | null;
  onClose: () => void;
}

export function useSubmitterModal({ editMeetingId, onClose }: UseSubmitterModalOptions) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<SubmitterStep1Values | null>(null);
  const [draftId, setDraftId] = useState<string | null>(editMeetingId ?? null);
  const inviteesRef = useRef<DynamicTableFormHandle>(null);

  const isEditMode = !!editMeetingId;
  const activeDraftId = editMeetingId || draftId;

  // ── Draft query (fetches editable fields in edit mode) ─────────────────────
  const {
    data: draftData,
    editableFields,
    isLoading: draftLoading,
    isError,
    error,
  } = useMeetingDraft(activeDraftId, !!activeDraftId, undefined, isEditMode);

  // ── Derived values ──────────────────────────────────────────────────────────
  const initialStep1Values = useMemo(
    () => (draftData ? mapMeetingToSubmitterStep1(draftData) : undefined),
    [draftData],
  );

  // const resolvedStep1Values = step1Data ?? (initialStep1Values as Partial<SubmitterStep1Values> | undefined);
  const resolvedStep1Values = useMemo(() => {
    if (step1Data) {
      // Preserve meeting_manager_name from the original mapped data for display purposes
      return { ...step1Data, meeting_manager_name: initialStep1Values?.meeting_manager_name } as Partial<SubmitterStep1Values> & { meeting_manager_name?: string };
    }
    return initialStep1Values as (Partial<SubmitterStep1Values> & { meeting_manager_name?: string }) | undefined;
  }, [step1Data, initialStep1Values]);
  const loading = draftLoading && !resolvedStep1Values && !!activeDraftId;

  const step2InitialContentData = useMemo(
    () => (draftData ? transformDraftToStep2ContentData(draftData as any) : undefined),
    [draftData],
  );

  const initialStep3Values = useMemo(
    () => (draftData ? transformDraftToInvitees(draftData as Record<string, unknown>) : []),
    [draftData],
  );

  const fetchedStatus = (draftData as Record<string, unknown> | undefined)?.status as string | undefined;
  const resolvedStatus = fetchedStatus || MeetingStatus.DRAFT;
  const canSaveAsDraft = SAVEABLE_DRAFT_STATUSES.has(resolvedStatus);

  /** UC01 (submitter) must not update a request while it is under review */
  const editBlockedUnderReview =
    isEditMode && !draftLoading && !!draftData && resolvedStatus === MeetingStatus.UNDER_REVIEW;

  // Apply editable-fields restrictions when the draft was returned from scheduling or content
  const resolvedEditableFields =
    resolvedStatus === MeetingStatus.RETURNED_FROM_SCHEDULING ||
    resolvedStatus === MeetingStatus.RETURNED_FROM_CONTENT
      ? editableFields
      : null;
  const fetchError = isError
    ? error?.message || "فشل تحميل بيانات الاجتماع"
    : editBlockedUnderReview
      ? "لا يمكن تعديل طلب الاجتماع وهو قيد المراجعة."
      : null;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const basicInfoMutation = useSaveDraftBasicInfo();
  const contentMutation = useSaveDraftContent();
  const inviteesMutation = useSaveDraftInvitees();
  const submitMutation = useSubmitDraft();
  const resubmitSchedulingMutation = useResubmitToScheduling();
  const resubmitContentMutation = useResubmitToContent();

  const saving =
    basicInfoMutation.isPending ||
    contentMutation.isPending ||
    inviteesMutation.isPending ||
    submitMutation.isPending ||
    resubmitSchedulingMutation.isPending ||
    resubmitContentMutation.isPending;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const resetModal = useCallback(() => {
    onClose();
    setCurrentStep(1);
    setStep1Data(null);
    setDraftId(null);
  }, [onClose]);

  const handleStep1Submit = useCallback(
    (data: SubmitterStep1Values) => {
      if (isEditMode && resolvedStatus === MeetingStatus.UNDER_REVIEW) {
        toast.error("لا يمكن تعديل طلب الاجتماع وهو قيد المراجعة.");
        return;
      }
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
    [draftId, basicInfoMutation, isEditMode, resolvedStatus],
  );

  const handleStep2Submit = useCallback(
    (formData: FormData) => {
      if (isEditMode && resolvedStatus === MeetingStatus.UNDER_REVIEW) {
        toast.error("لا يمكن تعديل طلب الاجتماع وهو قيد المراجعة.");
        return;
      }
      if (!draftId) return;
      if (!formData) {
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
    [draftId, contentMutation, isEditMode, resolvedStatus],
  );

  const getSubmitFn = useCallback(
    (status: string) => {
      if (status === MeetingStatus.RETURNED_FROM_SCHEDULING) return resubmitSchedulingMutation.mutateAsync;
      if (status === MeetingStatus.RETURNED_FROM_CONTENT) return resubmitContentMutation.mutateAsync;
      return submitMutation.mutateAsync;
    },
    [submitMutation, resubmitSchedulingMutation, resubmitContentMutation],
  );

  const handleFinalSubmit = useCallback(async () => {
    if (!draftId) return;
    if (isEditMode && resolvedStatus === MeetingStatus.UNDER_REVIEW) {
      toast.error("لا يمكن تعديل طلب الاجتماع وهو قيد المراجعة.");
      return;
    }

    const inviteesPayload = inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return;

    try {
      const { status } = await inviteesMutation.mutateAsync({ draftId, invitees: inviteesPayload });
      const submitFn = getSubmitFn(status);
      await submitFn(draftId);
      toast.success("تم إرسال الطلب بنجاح");
      resetModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إرسال الطلب");
    }
  }, [draftId, inviteesMutation, getSubmitFn, resetModal, isEditMode, resolvedStatus]);

  const handleSaveAsDraft = useCallback(async () => {
    if (!draftId) return;
    if (isEditMode && resolvedStatus === MeetingStatus.UNDER_REVIEW) {
      toast.error("لا يمكن تعديل طلب الاجتماع وهو قيد المراجعة.");
      return;
    }

    const inviteesPayload = inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return;

    try {
      await inviteesMutation.mutateAsync({ draftId, invitees: inviteesPayload });
      toast.success("تم حفظ المسودة بنجاح");
      resetModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل حفظ المسودة");
    }
  }, [draftId, inviteesMutation, resetModal, isEditMode, resolvedStatus]);

  const goToPrevStep = useCallback(() => setCurrentStep((s) => s - 1), []);

  const triggerActiveFormSubmit = useCallback(() => {
    const form = document.querySelector<HTMLFormElement>(`[data-step="${currentStep}"] form`);
    form?.requestSubmit();
  }, [currentStep]);

  return {
    // State
    currentStep,
    step1Data,
    draftId,
    activeDraftId,
    inviteesRef,
    isEditMode,

    // Derived
    resolvedStep1Values,
    step2InitialContentData,
    initialStep3Values,
    editableFields: resolvedEditableFields,
    meetingStatus: resolvedStatus,
    loading,
    saving,
    canSaveAsDraft,
    fetchError,

    // Handlers
    handleStep1Submit,
    handleStep2Submit,
    handleFinalSubmit,
    handleSaveAsDraft,
    goToPrevStep,
    triggerActiveFormSubmit,
    setCurrentStep,
  };
}