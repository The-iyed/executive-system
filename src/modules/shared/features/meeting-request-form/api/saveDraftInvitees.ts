import { axiosInstance, toError } from './config';

/**
 * Save invitees (Step 3) for a meeting draft.
 */
export async function saveDraftInvitees(
  draftId: string,
  invitees: Record<string, unknown>[],
): Promise<{ status: string }> {
  try {
    const { data } = await axiosInstance.patch<{ status?: string }>(
      `/api/meeting-requests/drafts/${draftId}/invitees`,
      { invitees },
    );
    return { status: data?.status ?? 'DRAFT' };
  } catch (err) {
    throw toError('Failed to save invitees', err);
  }
}

