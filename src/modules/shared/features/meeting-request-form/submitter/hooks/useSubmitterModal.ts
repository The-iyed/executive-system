import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSaveDraftBasicInfo,
  useSaveDraftContent,
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
import { optimisticMergeMeeting, buildStep1Patch, buildStep2Patch, buildStep3Patch } from "../../shared/utils/optimisticCacheUpdate";
import { buildStep1FormData } from "../../shared/utils/buildStep1FormData";

interface UseSubmitterModalOptions {
  open: boolean;
  editMeetingId?: string | null;
  onClose: () => void;
  callerRole?: MeetingOwnerType;
}

export function useSubmitterModal({
  open,
  editMeetingId,
  onClose,
  callerRole,
}: UseSubmitterModalOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSchedulerEdit = callerRole === MeetingOwnerType.SCHEDULING;
  const isEditMode = !!editMeetingId;
  const [isFinalizing, setIsFinalizing] = useState(false);

  // ── Sync helper ───────────────────────────────────────────────────────────
  const syncMeetingDetails = useCallback(async (meetingId: string, preservePatch?: Record<string, unknown> | null) => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['meeting', meetingId] }),
      queryClient.refetchQueries({ queryKey: ['meeting-draft', meetingId] }),
      queryClient.refetchQueries({ queryKey: ['meeting', meetingId, 'preview'] }),
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] }),
      queryClient.invalidateQueries({ queryKey: ['work-basket', 'uc02'] }),
      queryClient.invalidateQueries({ queryKey: ['calendar-timeline'] }),
    ]);
    if (preservePatch) {
      optimisticMergeMeeting(queryClient, meetingId, preservePatch);
    }
  }, [queryClient]);

  // ── Step navigation (no API calls) ────────────────────────────────────────
  const steps = useModalSteps({ open, editMeetingId });

  // ── Meeting data & derived values ─────────────────────────────────────────
  const detail = useMeetingDetail({
    meetingId: steps.activeDraftId,
    isEditMode: steps.isEditMode,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const basicInfoMutation = useSaveDraftBasicInfo();
  const contentMutation = useSaveDraftContent();
  const inviteesMutation = useSaveDraftInvitees();
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
   * Orchestrate all 3 steps sequentially, then submit.
   * For new meetings: step1 POST returns draftId needed by steps 2 & 3.
   * For edits: draftId already exists.
   */
  const handleFinalSubmit = async () => {
    if (!steps.step1Data) {
      toast({ title: "يرجى إكمال الخطوة الأولى", variant: "destructive" });
      return;
    }

    const rawRows = steps.inviteesRef.current?.getRows() ?? [];
    const inviteesPayload = steps.inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return;

    setIsFinalizing(true);

    try {
      // ── Step 1: Save basic info ──────────────────────────────────────────
      const formData = buildStep1FormData(steps.step1Data);
      const meetingId = await basicInfoMutation.mutateAsync({
        formData,
        draftId: steps.activeDraftId,
      });

      // Update draftId for new meetings
      if (!steps.activeDraftId) {
        steps.setDraftId(meetingId);
      }

      // Optimistic cache update for step 1
      if (isEditMode && meetingId) {
        const patch = buildStep1Patch(steps.step1Data as unknown as Record<string, unknown>);
        optimisticMergeMeeting(queryClient, meetingId, patch);
      }

      // ── Step 2: Save content ─────────────────────────────────────────────
      if (steps.step2Data) {
        await contentMutation.mutateAsync({
          draftId: meetingId,
          payload: steps.step2Data,
        });

        if (isEditMode) {
          const patch = buildStep2Patch(steps.step2Data);
          optimisticMergeMeeting(queryClient, meetingId, patch);
        }
      }

      // ── Step 3: Save invitees ────────────────────────────────────────────
      let inviteePatch: Record<string, unknown> | null = null;
      if (isEditMode && rawRows.length > 0) {
        inviteePatch = buildStep3Patch(rawRows);
        optimisticMergeMeeting(queryClient, meetingId, inviteePatch);
      }

      const response = await inviteesMutation.mutateAsync({
        draftId: meetingId,
        invitees: inviteesPayload,
      });

      const meetingStatus = response.status;

      // ── Submit / resubmit ────────────────────────────────────────────────
      if (isSchedulerEdit) {
        toast({ title: "تم التحديث بنجاح" });
        onClose();
        // Sync AFTER close to avoid re-rendering forms while modal is visible
        if (isEditMode) {
          syncMeetingDetails(meetingId, inviteePatch);
        }
        return;
      }

      const submitAction = resolveSubmitAction(meetingStatus);
      if (submitAction) {
        await submitAction(meetingId);
        toast({ title: "تم إرسال الطلب بنجاح" });
      } else {
        toast({ title: "تم التحديث بنجاح" });
      }

      // Close first, then sync to prevent form re-render flicker
      onClose();
      if (isEditMode) {
        syncMeetingDetails(meetingId, inviteePatch);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      }
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "فشل إرسال الطلب", variant: 'destructive' });
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

    const rawRows = steps.inviteesRef.current?.getRows() ?? [];
    const inviteesPayload = steps.inviteesRef.current?.validateAndGetPayload();
    if (!inviteesPayload) return;

    setIsFinalizing(true);

    try {
      // Step 1
      const formData = buildStep1FormData(steps.step1Data);
      const meetingId = await basicInfoMutation.mutateAsync({
        formData,
        draftId: steps.activeDraftId,
      });

      if (!steps.activeDraftId) {
        steps.setDraftId(meetingId);
      }

      // Step 2
      if (steps.step2Data) {
        await contentMutation.mutateAsync({
          draftId: meetingId,
          payload: steps.step2Data,
        });
      }

      // Step 3
      let inviteePatch: Record<string, unknown> | null = null;
      if (isEditMode && rawRows.length > 0) {
        inviteePatch = buildStep3Patch(rawRows);
        optimisticMergeMeeting(queryClient, meetingId, inviteePatch);
      }

      await inviteesMutation.mutateAsync({
        draftId: meetingId,
        invitees: inviteesPayload,
      });

      if (isEditMode) {
        await syncMeetingDetails(meetingId, inviteePatch);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      }
      toast({ title: "تم حفظ المسودة بنجاح" });
      onClose();
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
