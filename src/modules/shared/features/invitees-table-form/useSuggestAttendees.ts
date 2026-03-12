import { useMutation } from "@tanstack/react-query";
import { suggestMeetingAttendees, type UseSuggestMeetingAttendeesParams } from "./api";

/**
 * React Query mutation hook for suggesting meeting attendees via AI.
 */
export function useSuggestAttendees() {
  return useMutation({
    mutationFn: ({ count, meeting }: { count: number; meeting: UseSuggestMeetingAttendeesParams["meeting"] }) =>
      suggestMeetingAttendees(count, meeting),
  });
}
