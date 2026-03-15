import { useMemo } from "react";
import { useMeetingDraft } from "../../shared/hooks/useMeetingDraft";
import { MeetingStatus, SAVEABLE_DRAFT_STATUSES } from "../../shared/types/types";
import {
  mapMeetingToSubmitterStep1,
  transformDraftToStep2ContentData,
  transformDraftToInvitees,
} from "../../shared/utils/mappers";
import type { ModalCallerRole } from "./useSubmitterModal";

interface UseMeetingDetailOptions {
  meetingId: string | null;
  isEditMode: boolean;
  callerRole: ModalCallerRole;
}

export function useMeetingDetail({
  meetingId,
  isEditMode,
  callerRole,
}: UseMeetingDetailOptions) {
  const isSchedulerEdit = callerRole === "scheduler";

  // Only fetch editable fields for submitter edits (scheduler always has full access)
  const needsEditableFields = isEditMode && !isSchedulerEdit;

  const {
    data: draftData,
    editableFields,
    isLoading: draftLoading,
    isError,
    error,
  } = useMeetingDraft(meetingId, !!meetingId, undefined, needsEditableFields);

  // ── Initial values for each step ────────────────────────────────────────
  const initialStep1Values = useMemo(
    () => (draftData ? mapMeetingToSubmitterStep1(draftData) : undefined),
    [draftData],
  );

  const initialStep2Values = useMemo(
    () => (draftData ? transformDraftToStep2ContentData(draftData as any) : undefined),
    [draftData],
  );

  const initialStep3Values = useMemo(
    () => (draftData ? transformDraftToInvitees(draftData as Record<string, unknown>) : []),
    [draftData],
  );

  const meetingStatus = draftData?.status as MeetingStatus || MeetingStatus.DRAFT ;
  const canSaveAsDraft = SAVEABLE_DRAFT_STATUSES.has(meetingStatus);

  // Expose editable fields when submitter may edit: returned-for-info statuses, or scheduled / scheduled-additional-info.
  // For SCHEDULED and SCHEDULED_ADDITIONAL_INFO(*) use API editable_fields when present; otherwise allow all fields (null).
  const isReturnedStatus =
    meetingStatus === MeetingStatus.RETURNED_FROM_SCHEDULING ||
    meetingStatus === MeetingStatus.RETURNED_FROM_CONTENT;
  const isScheduledEditableStatus =
    meetingStatus === MeetingStatus.SCHEDULED ||
    meetingStatus === MeetingStatus.SCHEDULED_ADDITIONAL_INFO ||
    meetingStatus === MeetingStatus.SCHEDULED_ADDITIONAL_INFO_CONTENT;
  const resolvedEditableFields = isReturnedStatus
    ? editableFields
    : isScheduledEditableStatus
      ? (editableFields && editableFields.length > 0 ? editableFields : null)
      : null;

  const loading = draftLoading && !initialStep1Values && !!meetingId;
  const fetchError = isError ? (error?.message || "فشل تحميل بيانات الاجتماع") : null;

  return {
    initialStep1Values,
    initialStep2Values,
    initialStep3Values,
    editableFields: resolvedEditableFields,
    meetingStatus,
    canSaveAsDraft,
    loading,
    fetchError,
  };
}
