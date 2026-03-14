import { axiosInstance, toError } from './config';

export async function createSchedulerStep1(payload: FormData): Promise<string> {
  try {
    const { data } = await axiosInstance.post<{ id?: string | number; meeting_id?: string | number }>(
      '/api/meeting-requests/direct-schedule/step1',
      payload,
    );
    const id = data?.id ?? data?.meeting_id;
    if (!id) {
      throw new Error('Invalid response format: missing meeting ID');
    }
    return String(id);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Invalid response format')) throw err;
    throw toError('Failed to create scheduler step 1', err);
  }
}

export async function saveSchedulerStep2Content(
  meetingId: string,
  payload: FormData,
): Promise<void> {
  try {
    await axiosInstance.put(
      `/api/meeting-requests/direct-schedule/${meetingId}/content`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  } catch (err) {
    throw toError('Failed to save scheduler step 2 content', err);
  }
}

export async function saveSchedulerStep3Invitees(
  meetingId: string,
  invitees: Record<string, unknown>[],
  schedule?:boolean
): Promise<void> {
  try {
    await axiosInstance.put(
      `/api/meeting-requests/direct-schedule/${meetingId}/step3`,
      { invitees },
      {
        params: schedule !== undefined ? { schedule } : undefined,
      }
    );
  } catch (err) {
    throw toError('Failed to save scheduler step 3 invitees', err);
  }
}