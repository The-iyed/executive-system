import { useQuery } from "@tanstack/react-query";
import { fetchMeetingDraft } from "../../api";

export interface MeetingDraftResult<T = Record<string, unknown>> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useMeetingDraft<T = Record<string, unknown>>(
  meetingId: string | null | undefined,
  enabled: boolean,
  mapper?: (data: Record<string, unknown>) => T,
): MeetingDraftResult<T> {
  const query = useQuery<Record<string, unknown>>({
    queryKey: ["meeting-draft", meetingId],
    queryFn: () => fetchMeetingDraft(meetingId!),
    enabled: !!meetingId && enabled,
    staleTime: 60_000,
    retry: 1,
  });

  const data = query.data
    ? (mapper ? mapper(query.data) : (query.data as T))
    : undefined;

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
