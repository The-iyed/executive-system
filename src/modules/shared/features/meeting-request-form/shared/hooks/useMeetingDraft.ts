import { useQuery } from "@tanstack/react-query";
import { fetchMeetingDraft, fetchMeetingDraftWithEditableFields, MeetingDraftWithEditableFields } from "../../api";


export interface MeetingDraftResult<T = Record<string, unknown>> {
  data: T | undefined;
  editableFields: string[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Generic draft loader that fetches both draft data and editable fields
 * in a single parallel call. If either request fails, the whole query fails.
 *
 * @param meetingId - Draft/meeting ID to fetch
 * @param enabled - Whether the query is enabled
 * @param mapper - Optional mapper to convert raw draft data into typed form values
 * @param withEditableFields - When true, also fetches editable fields (edit mode). Default: false.
 */
export function useMeetingDraft<T = Record<string, unknown>>(
  meetingId: string | null | undefined,
  enabled: boolean,
  mapper?: (data: Record<string, unknown>) => T,
  withEditableFields = false,
): MeetingDraftResult<T> {
  const query = useQuery<MeetingDraftWithEditableFields | Record<string, unknown>>({
    queryKey: ["meeting-draft", meetingId, withEditableFields],
    queryFn: async () => {
      if (withEditableFields) {
        return fetchMeetingDraftWithEditableFields(meetingId!);
      }
      return fetchMeetingDraft(meetingId!);
    },
    enabled: !!meetingId && enabled,
    staleTime: 60_000,
    retry: 1,
  });

  // Normalize result shape regardless of fetch mode
  const rawData = query.data;

  let data: T | undefined;
  let editableFields: string[] | null = null;

  if (rawData) {
    if (withEditableFields && isCompositeResult(rawData)) {
      const draft = rawData.draft;
      editableFields = rawData.editableFields;
      data = mapper ? mapper(draft) : (draft as T);
    } else {
      data = mapper ? mapper(rawData as Record<string, unknown>) : (rawData as T);
    }
  }

  return {
    data,
    editableFields,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

function isCompositeResult(
  data: unknown,
): data is MeetingDraftWithEditableFields {
  return (
    typeof data === "object" &&
    data !== null &&
    "draft" in data &&
    "editableFields" in data
  );
}
