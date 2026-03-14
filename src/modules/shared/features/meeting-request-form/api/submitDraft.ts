import { axiosInstance, toError } from './config';

export async function submitDraft(draftId: string): Promise<unknown> {
  try {
    const { data } = await axiosInstance.post(`/api/meeting-requests/drafts/${draftId}/submit`);
    return data;
  } catch (err) {
    throw toError('Failed to submit draft', err);
  }
}

export async function resubmitToScheduling(draftId: string): Promise<unknown> {
  try {
    const { data } = await axiosInstance.post(
      `/api/meeting-requests/drafts/${draftId}/resubmit-to-scheduling`,
    );
    return data;
  } catch (err) {
    throw toError('Failed to resubmit to scheduling', err);
  }
}

export async function resubmitToContent(draftId: string): Promise<unknown> {
  try {
    const { data } = await axiosInstance.post(
      `/api/meeting-requests/drafts/${draftId}/resubmit-to-content`,
    );
    return data;
  } catch (err) {
    throw toError('Failed to resubmit to content', err);
  }
}