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

interface EditableFieldsApiResponse {
  editable_fields?: unknown;
  [key: string]: unknown;
}

export async function fetchEditableFields(meetingId: string): Promise<string[]> {
  try {
    const { data } = await axiosInstance.get<EditableFieldsApiResponse>(
      `/api/meetings/my/${meetingId}`,
    );
    const fields = Array.isArray(data?.editable_fields)
      ? data.editable_fields.filter((field): field is string => typeof field === 'string')
      : [];
    return fields;
  } catch (err) {
    throw toError('Failed to fetch editable fields', err);
  }
}

export interface MeetingDraftWithEditableFields {
  draft: Record<string, unknown>;
  editableFields: string[];
}

/**
 * Fetches meeting for submitter edit from GET /api/meetings/my/:id.
 * Used when the draft endpoint returns 404/403 (e.g. for scheduled meetings).
 */
async function fetchMyMeeting(meetingId: string): Promise<{ draft: Record<string, unknown>; editableFields: string[] }> {
  const { data } = await axiosInstance.get<EditableFieldsApiResponse>(
    `/api/meetings/my/${meetingId}`,
  );
  const draft = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const editableFields = Array.isArray(data?.editable_fields)
    ? data.editable_fields.filter((field): field is string => typeof field === 'string')
    : [];
  return { draft, editableFields };
}

/**
 * Fetches both draft details and editable fields.
 * Tries the draft endpoint first; if it fails (e.g. 404 for scheduled meetings),
 * falls back to GET /api/meetings/my/:id so submitters can edit SCHEDULED and SCHEDULED_ADDITIONAL_INFO requests.
 */
export async function fetchMeetingDraftWithEditableFields(
  meetingId: string,
): Promise<MeetingDraftWithEditableFields> {
  try {
    const [draft, editableFields] = await Promise.all([
      fetchMeetingDraft(meetingId),
      fetchEditableFields(meetingId),
    ]);
    return { draft, editableFields };
  } catch (err) {
    const status = typeof err === 'object' && err !== null && 'response' in err
      ? (err as { response?: { status?: number } }).response?.status
      : undefined;
    if (status === 404 || status === 403) {
      return fetchMyMeeting(meetingId);
    }
    throw err;
  }
}

