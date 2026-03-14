import { axiosInstance, toError } from './config';

/**
 * Save content (Step 2) for a meeting draft.
 * Accepts a pre-built FormData from the Step2Form.
 */
export async function saveDraftContent(
  draftId: string,
  payload: FormData,
): Promise<void> {
  try {
    await axiosInstance.patch(`/api/meeting-requests/drafts/${draftId}/content`, payload);
  } catch (err) {
    throw toError('Failed to save content', err);
  }
}

