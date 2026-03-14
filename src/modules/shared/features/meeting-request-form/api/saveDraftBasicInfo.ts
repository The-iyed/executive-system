import { axiosInstance, toError } from './config';

const BASIC_INFO_RESPONSE_ID_KEY = 'id';

export async function saveDraftBasicInfo(
  payload: FormData,
  draftId?: string | null,
): Promise<string> {
  const isEdit = !!draftId;
  const url = isEdit
    ? `/api/meeting-requests/drafts/${draftId}/basic-info`
    : '/api/meeting-requests/drafts/basic-info';

  try {
    const { data } = await axiosInstance.request<Record<string, unknown>>({
      method: isEdit ? 'PATCH' : 'POST',
      url,
      data: payload,
    });

    const newDraftId = data?.[BASIC_INFO_RESPONSE_ID_KEY] ?? draftId;
    if (!newDraftId) {
      throw new Error('Invalid response format: missing draft ID');
    }

    return newDraftId as string;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid response format')) throw err;
    throw toError('Failed to save basic info', err);
  }
}

