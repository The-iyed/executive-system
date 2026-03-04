import axiosInstance from '@/modules/auth/utils/axios';
import {
  getDraftById,
  submitDraft,
  resubmitToScheduling,
  resubmitToContent,
} from '../../../data/draftApi';
import { createStep3InviteesSchema, type Step3InviteesFormData } from '../schemas/step3Invitees.schema';
import { AttendanceMechanism, MeetingStatus } from '@/modules/shared/types';
import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '../../../hooks';
import { trackEvent } from '@analytics';

export interface Step3SubmitFlowParams {
  draftId: string;
  formData: Partial<Step3InviteesFormData>;
  inviteesRequired: boolean;
  isDraft: boolean;
  onSuccess: () => void;
  onError: (error: Error) => void;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
}

export async function executeStep3SubmitFlow(params: Step3SubmitFlowParams): Promise<void> {
  const {
    draftId,
    formData,
    inviteesRequired,
    isDraft,
    onSuccess,
    onError,
    showSuccessToast,
    showErrorToast,
  } = params;

  if (!isDraft) {
    const validationResult = createStep3InviteesSchema({ inviteesRequired }).safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const message = firstError?.message ?? 'التحقق من البيانات فشل';
      onError(new Error(message));
      throw new Error(message);
    }
  }

  const MANUAL_ENTRY_VALUE = '__manual__';
  const inviteesPayload = formData.invitees?.map((invitee, index) => {
    const objectGuid = (invitee as { object_guid?: string }).object_guid;
    if (objectGuid && objectGuid !== MANUAL_ENTRY_VALUE) {
      return {
        object_guid: objectGuid,
        email: invitee.email || '',
        sector: invitee.sector?.trim() || '',
        attendance_mechanism: invitee.attendance_mechanism === AttendanceMechanism.VIRTUAL ? 'عن بعد' : 'حضوري',
        is_required: invitee.is_required || false,
        is_consultant: invitee.is_consultant ?? false,
      };
    }
    return {
      name: invitee.name || '',
      position: invitee.position || '',
      mobile: invitee.mobile || '',
      email: invitee.email || '',
      sector: invitee.sector?.trim() || '',
      attendance_mechanism: invitee.attendance_mechanism === AttendanceMechanism.VIRTUAL ? 'عن بعد' : 'حضوري',
      item_number: index + 1,
      is_required: invitee.is_required || false,
      is_consultant: invitee.is_consultant ?? false,
    };
  }) ?? [];

  const minister_invitees = (formData.minister_attendees ?? []).map((m) => {
    const name = (m.external_name ?? '').trim();
    const email = (m.external_email ?? '').trim() || name;
    return {
      external_name: name,
      position: m.position?.trim() ?? '',
      external_email: email,
      mobile: m.mobile?.trim() ?? '',
      attendance_mechanism: m.attendance_channel === 'REMOTE' ? 'عن بعد' : 'حضوري',
      is_required: m.is_required ?? false,
      justification: m.justification?.trim() ?? '',
    };
  });

  const body = {
    invitees: inviteesPayload,
    minister_invitees,
  };

  try {
    await axiosInstance.patch(
      `/api/meeting-requests/drafts/${draftId}/invitees`,
      body
    );
  } catch (err) {
    const message = (err && typeof err === 'object' && typeof (err as { detail?: string }).detail === 'string')
      ? (err as { detail: string }).detail
      : 'حدث خطأ أثناء حفظ قائمة المدعوين';
    const error = err instanceof Error ? err : new Error(message);
    onError(error);
    throw error;
  }

  if (isDraft) {
    trackEvent('UC-01', 'uc01_meeting_request_draft_saved', { draft_id: draftId });
    onSuccess();
    return;
  }

  const draft = await getDraftById(draftId);
  const status = draft?.status ?? '';

  const callSubmitAndFinish = async (submitApi: (id: string) => Promise<unknown>) => {
    try {
      await submitApi(draftId);
      trackEvent('UC-01', 'uc01_meeting_request_submitted', { draft_id: draftId });
      showSuccessToast(SUCCESS_MESSAGE);
      onSuccess();
    } catch (err) {
      const message =
        err && typeof err === 'object' && typeof (err as { detail?: string }).detail === 'string'
          ? (err as { detail: string }).detail
          : err instanceof Error
            ? err.message
            : ERROR_MESSAGE;
      const error = err instanceof Error ? err : new Error(message);
      showErrorToast(message);
      onError(error);
      throw error;
    }
  };

  if (status === MeetingStatus.DRAFT) {
    await callSubmitAndFinish(submitDraft);
    return;
  }
  if (status === MeetingStatus.RETURNED_FROM_SCHEDULING) {
    await callSubmitAndFinish(resubmitToScheduling);
    return;
  }
  if (status === MeetingStatus.RETURNED_FROM_CONTENT) {
    await callSubmitAndFinish(resubmitToContent);
    return;
  }

  onSuccess();
}