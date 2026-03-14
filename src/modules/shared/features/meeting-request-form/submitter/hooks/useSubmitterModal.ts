import { useCallback } from "react";
import { toast } from "sonner";
import {
  useSaveDraftInvitees,
  useSaveSchedulerStep3Invitees,
  useSubmitDraft,
  useResubmitToScheduling,
  useResubmitToContent,
} from "../../hooks/useDraftMutations";
import { MeetingStatus } from "../../shared/types/types";
import { useModalSteps } from "./useModalSteps";
import { useMeetingDetail } from "./useMeetingDetail";
import { MeetingOwnerType } from "@/modules/shared/types";

interface UseSubmitterModalOptions {
  editMeetingId?: string | null;
  onClose: () => void;
  callerRole?: MeetingOwnerType;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSubmitterModal({
  editMeetingId,
  onClose,
  callerRole,
}: UseSubmitterModalOptions) {
  const isSchedulerEdit = callerRole === MeetingOwnerType.SCHEDULING;

  // ── Step navigation & step 1/2 handlers ───────────────────────────────────
  const steps = useModalSteps({ editMeetingId, onClose });

  // ── Meeting data & derived values ─────────────────────────────────────────
  const detail = useMeetingDetail({
    meetingId: steps.activeDraftId,
    isEditMode: steps.isEditMode,
    callerRole,
  });

  // ── Role-specific mutations (step 3 / final submit) ───────────────────────
  const inviteesMutation = useSaveDraftInvitees();
  const schedulerInviteesMutation = useSaveSchedulerStep3Invitees();
  const submitMutation = useSubmitDraft();
  const resubmitSchedulingMutation = useResubmitToScheduling();
  const resubmitContentMutation = useResubmitToContent();

  const saving =
    steps.isStepSaving ||
    inviteesMutation.isPending ||
    schedulerInviteesMutation.isPending ||
    submitMutation.isPending ||
    resubmitSchedulingMutation.isPending ||
    resubmitContentMutation.isPending;

  // ── Submit strategy resolver (submitter flow only) ────────────────────────
  const resolveSubmitAction = useCallback(
    (status: string): ((id: string) => Promise<unknown>) | null => {
      switch (status) {
        case MeetingStatus.DRAFT:
          return submitMutation.mutateAsync;
        case MeetingStatus.RETURNED_FROM_SCHEDULING:
          return resubmitSchedulingMutation.mutateAsync;
        case MeetingStatus.RETURNED_FROM_CONTENT:
          return resubmitContentMutation.mutateAsync;
        default:
          return null;
      }
    },
    [submitMutation, resubmitSchedulingMutation, resubmitContentMutation],
  );

  const saveInvitees = async (meetingId: string) => {
    const inviteesPayload = steps.inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return false;
  
    await inviteesMutation.mutateAsync({
      draftId: meetingId,
      invitees: inviteesPayload,
    });
  
    return true;
  };
  // ── Final submit (step 3) ─────────────────────────────────────────────────
  const handleFinalSubmit = useCallback(async () => {
    const meetingId = steps.draftId;
    if (!meetingId) return;
  
    try {
      const saved = await saveInvitees(meetingId);
      if (!saved) return;
  
      if (isSchedulerEdit) {
        toast.success("تم التحديث بنجاح");
        steps.resetModal();
        return;
      }
  
      const submitAction = resolveSubmitAction(detail.meetingStatus);
      if (submitAction) {
        await submitAction(meetingId);
        toast.success("تم إرسال الطلب بنجاح");
      } else {
        toast.success("تم التحديث بنجاح");
      }
  
      steps.resetModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إرسال الطلب");
    }
  }, [steps, isSchedulerEdit, detail.meetingStatus, inviteesMutation]);

  // ── Save as draft ─────────────────────────────────────────────────────────
  const handleSaveAsDraft = useCallback(async () => {
    const meetingId = steps.draftId;
    if (!meetingId) return;
  
    try {
      const saved = await saveInvitees(meetingId);
      if (!saved) return;
  
      toast.success("تم حفظ المسودة بنجاح");
      steps.resetModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل حفظ المسودة");
    }
  }, [steps, inviteesMutation]);

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    ...steps,
    ...detail,
    saving,
    handleFinalSubmit,
    handleSaveAsDraft,
  };
}