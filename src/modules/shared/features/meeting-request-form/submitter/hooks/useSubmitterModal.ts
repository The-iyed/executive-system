import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/lib/ui";
import { optimisticMergeMeeting, buildStep3Patch } from "../../shared/utils/optimisticCacheUpdate";

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
  const { toast }= useToast()
  const queryClient = useQueryClient();
  const isSchedulerEdit = callerRole === MeetingOwnerType.SCHEDULING;
  const isEditMode = !!editMeetingId;

  // ── Sync helper: invalidate queries so each page refetches with its own API
  const syncMeetingDetails = useCallback(async (meetingId: string) => {
    // Use refetchQueries to wait for the refetch to complete before closing modal
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['meeting', meetingId] }),
      queryClient.refetchQueries({ queryKey: ['meeting-draft', meetingId] }),
      queryClient.refetchQueries({ queryKey: ['meeting', meetingId, 'preview'] }),
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] }),
      queryClient.invalidateQueries({ queryKey: ['work-basket', 'uc02'] }),
      queryClient.invalidateQueries({ queryKey: ['calendar-timeline'] }),
    ]);
  }, [queryClient]);

  // ── Step navigation & step 1/2 handlers ───────────────────────────────────
  const steps = useModalSteps({
    editMeetingId,
    onClose,
    onStepSaved: isEditMode
      ? (draftId) => syncMeetingDetails(draftId)
      : undefined,
  });

  // ── Meeting data & derived values ─────────────────────────────────────────
  const detail = useMeetingDetail({
    meetingId: steps.activeDraftId,
    isEditMode: steps.isEditMode,
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
  
    const response = await inviteesMutation.mutateAsync({
      draftId: meetingId,
      invitees: inviteesPayload,
    });

    // Optimistic cache update using raw TableRow[] (not mapped payload) for correct data shape
    if (isEditMode) {
      const rawRows = steps.inviteesRef.current?.getRows() ?? [];
      const patch = buildStep3Patch(rawRows);
      optimisticMergeMeeting(queryClient, meetingId, patch);
    }
  
    return response;
  };

  // ── Final submit (step 3) ─────────────────────────────────────────────────
  const handleFinalSubmit = useCallback(async () => {
    const meetingId = steps.draftId;
    if (!meetingId) return;
  
    try {
      const result = await saveInvitees(meetingId);
      if (!result) return;

      const meetingStatus = result.status;
  
      if (isSchedulerEdit) {
        if (isEditMode) {
          await syncMeetingDetails(meetingId);
        }
        toast({title: "تم التحديث بنجاح"});
        steps.resetModal();
        return;
      }

      const submitAction = resolveSubmitAction(meetingStatus);
      if (submitAction) {
        await submitAction(meetingId);
        toast({title: "تم إرسال الطلب بنجاح"});
      } else {
        toast({title: "تم التحديث بنجاح"});
      }
  
      if (isEditMode) {
        await syncMeetingDetails(meetingId);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      }
      steps.resetModal();
    } catch (err) {
      toast({title: err instanceof Error ? err.message : "فشل إرسال الطلب", variant:'destructive'});
    }
  }, [steps, isSchedulerEdit, isEditMode, resolveSubmitAction, syncMeetingDetails, queryClient, toast]);

  // ── Save as draft ─────────────────────────────────────────────────────────
  const handleSaveAsDraft = useCallback(async () => {
    const meetingId = steps.draftId;
    if (!meetingId) return;
  
    try {
      const saved = await saveInvitees(meetingId);
      if (!saved) return;
  
      if (isEditMode) {
        await syncMeetingDetails(meetingId);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      }
      toast({title: "تم حفظ المسودة بنجاح"});
      steps.resetModal();
    } catch (err) {
      toast({title: err instanceof Error ? err.message : "فشل حفظ المسودة", variant:'destructive'});
    }
  }, [steps, isEditMode, syncMeetingDetails, queryClient, toast]);

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    ...steps,
    ...detail,
    saving,
    handleFinalSubmit,
    handleSaveAsDraft,
  };
}
