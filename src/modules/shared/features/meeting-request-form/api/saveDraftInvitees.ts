import { axiosInstance, toError } from './config';

/**
 * Save invitees (Step 3) for a meeting draft.
 */
export async function saveDraftInvitees(
  draftId: string,
  invitees: Record<string, unknown>[],
  is_content_updated?: boolean,
): Promise<{ status: string }> {
  try {
    const body: Record<string, unknown> = { invitees };
    if (is_content_updated !== undefined) {
      body.is_content_updated = is_content_updated;
    }
    const { data } = await axiosInstance.patch<{ status?: string }>(
      `/api/meeting-requests/drafts/${draftId}/invitees`,
      body,
    );
    return { status: data?.status ?? 'DRAFT' };
  } catch (err) {
    throw toError('Failed to save invitees', err);
  }
}

