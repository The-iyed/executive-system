import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSaveDraftUnified,
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

interface UseSubmitterModalOptions {
  open: boolean;
  editMeetingId?: string | null;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  callerRole?: MeetingOwnerType;
}

export function useSubmitterModal({
  open,
  editMeetingId,
  onClose,
  onSubmitSuccess,
  callerRole,
}: UseSubmitterModalOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSchedulerEdit = callerRole === MeetingOwnerType.SCHEDULING;
  const isEditMode = !!editMeetingId;
  const [isFinalizing, setIsFinalizing] = useState(false);

  // ── Sync helper ───────────────────────────────────────────────────────────
  // Invalidate list queries immediately, but delay meeting detail refetch
  // to allow the backend to propagate changes. Optimistic patches already
  // keep the UI correct in the meantime.
  const syncMeetingDetails = useCallback((meetingId: string, _preservePatch?: Record<string, unknown> | null) => {
    // List queries — invalidate immediately (they re-fetch on next render)
    queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
    queryClient.invalidateQueries({ queryKey: ['work-basket', 'uc02'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-timeline'] });

    // Meeting detail — invalidate immediately (server has data by the time this is called)
    queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    queryClient.invalidateQueries({ queryKey: ['meeting-draft', meetingId] });
    queryClient.invalidateQueries({ queryKey: ['meeting', meetingId, 'preview'] });
  }, [queryClient]);

  // ── Step navigation (no API calls) ────────────────────────────────────────
  const steps = useModalSteps({ open, editMeetingId });

  // ── Meeting data & derived values ─────────────────────────────────────────
  const detail = useMeetingDetail({
    meetingId: steps.activeDraftId,
    isEditMode: steps.isEditMode,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveUnifiedMutation = useSaveDraftUnified();
  const schedulerInviteesMutation = useSaveSchedulerStep3Invitees();
  const submitMutation = useSubmitDraft();
  const resubmitSchedulingMutation = useResubmitToScheduling();
  const resubmitContentMutation = useResubmitToContent();

  const saving = isFinalizing;

  const canSaveAsDraft = detail.canSaveAsDraft;

  // ── Submit strategy resolver ──────────────────────────────────────────────
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

  /**
   * Save basic-info + content + invitees in one request, then submit/resubmit when applicable.
   * Returns the draft/meeting id after a successful save (and UI close), or null if validation/save failed.
   */
  const handleFinalSubmit = async (): Promise<string | null> => {
    if (!steps.step1Data) {
      toast({ title: "يرجى إكمال الخطوة الأولى", variant: "destructive" });
      return null;
    }

    const inviteesPayload = steps.inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return null;

    const step1Data = steps.step1Data;
    const step2Data = steps.step2Data;
    const draftId = steps.activeDraftId;

    setIsFinalizing(true);

    try {
      const { id: meetingId, status: meetingStatus } = await saveUnifiedMutation.mutateAsync({
        step1Data: step1Data as Record<string, unknown>,
        step2FormData: step2Data,
        invitees: inviteesPayload,
        draftId,
        ...(isSchedulerEdit && { is_content_updated: !!step2Data }),
      });

      if (!draftId) {
        steps.setDraftId(meetingId);
      }

      // ── Submit / resubmit ────────────────────────────────────────────
      if (isSchedulerEdit) {
        toast({ title: "تم التحديث بنجاح" });
        if (isEditMode) syncMeetingDetails(meetingId);
        onSubmitSuccess?.();
        onClose();
        return meetingId;
      }

      const submitAction = resolveSubmitAction(meetingStatus);
      let submitFollowUpError: Error | null = null;
      if (submitAction) {
        try {
          await submitAction(meetingId);
        } catch (e) {
          submitFollowUpError = e instanceof Error ? e : new Error(String(e));
        }
      }

      if (submitFollowUpError) {
        toast({
          title: submitFollowUpError.message,
          variant: 'destructive',
        });
      } else if (submitAction) {
        toast({ title: "تم إرسال الطلب بنجاح" });
      } else {
        toast({ title: "تم التحديث بنجاح" });
      }

      if (isEditMode) {
        syncMeetingDetails(meetingId);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      }

      onSubmitSuccess?.();
      onClose();
      return meetingId;
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "فشل إرسال الطلب", variant: 'destructive' });
      return null;
    } finally {
      setIsFinalizing(false);
    }
  };

  // ── Save as draft ─────────────────────────────────────────────────────────
  const handleSaveAsDraft = async () => {
    if (!steps.step1Data) {
      toast({ title: "يرجى إكمال الخطوة الأولى", variant: "destructive" });
      return;
    }

    const inviteesPayload = steps.inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return;

    setIsFinalizing(true);

    try {
      const { id: meetingId } = await saveUnifiedMutation.mutateAsync({
        step1Data: steps.step1Data as Record<string, unknown>,
        step2FormData: steps.step2Data,
        invitees: inviteesPayload,
        draftId: steps.activeDraftId,
        ...(isSchedulerEdit && { is_content_updated: !!steps.step2Data }),
      });

      if (!steps.activeDraftId) {
        steps.setDraftId(meetingId);
      }

      toast({ title: "تم حفظ المسودة بنجاح" });
      onClose();
      // Sync AFTER close to prevent form re-render flicker
      if (isEditMode) {
        syncMeetingDetails(meetingId);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      }
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "فشل حفظ المسودة", variant: 'destructive' });
    } finally {
      setIsFinalizing(false);
    }
  };

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    ...steps,
    ...detail,
    saving,
    handleFinalSubmit,
    handleSaveAsDraft,
  };
}
