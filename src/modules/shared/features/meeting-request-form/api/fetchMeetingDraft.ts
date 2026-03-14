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
 * Fetches both draft details and editable fields in parallel.
 * If either request fails, the entire operation fails (Promise.all).
 */
export async function fetchMeetingDraftWithEditableFields(
  meetingId: string,
): Promise<MeetingDraftWithEditableFields> {
  const [draft, editableFields] = await Promise.all([
    fetchMeetingDraft(meetingId),
    fetchEditableFields(meetingId),
  ]);

  return { draft, editableFields };
}

