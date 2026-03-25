import { axiosInstance, toError } from './config';

export async function fetchMeetingDraft(meetingId: string): Promise<Record<string, unknown>> {
  try {
    const { data } = await axiosInstance.get<Record<string, unknown>>(
      `/api/meeting-requests/drafts/${meetingId}`,
    );
    return data;
  } catch (err) {
    throw toError('Failed to fetch draft', err);
  }
}
