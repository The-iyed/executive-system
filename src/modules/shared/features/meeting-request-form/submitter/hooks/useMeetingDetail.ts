import { useMemo } from "react";
import { useMeetingDraft } from "../../shared/hooks/useMeetingDraft";
import { MeetingStatus, SAVEABLE_DRAFT_STATUSES } from "../../shared/types/types";
import {
  mapMeetingToSubmitterStep1,
  transformDraftToStep2ContentData,
  transformDraftToInvitees,
} from "../../shared/utils/mappers";

interface UseMeetingDetailOptions {
  meetingId: string | null;
  isEditMode: boolean;
}

export function useMeetingDetail({
  meetingId,
  isEditMode,
}: UseMeetingDetailOptions) {
  const {
    data: draftData,
    isLoading: draftLoading,
    isError,
    error,
  } = useMeetingDraft(meetingId, !!meetingId);

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

  const meetingStatus = (draftData?.status as MeetingStatus) || MeetingStatus.DRAFT;
  const canSaveAsDraft = SAVEABLE_DRAFT_STATUSES.has(meetingStatus);

  const loading = draftLoading && !initialStep1Values && !!meetingId;
  const fetchError = isError ? (error?.message || "فشل تحميل بيانات الاجتماع") : null;

  return {
    initialStep1Values,
    initialStep2Values,
    initialStep3Values,
    meetingStatus,
    canSaveAsDraft,
    loading,
    fetchError,
  };
}
