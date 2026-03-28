import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { calendarMeetingSchema, type CalendarMeetingValues } from "./schema";
import {
  MeetingType,
  AttendanceMechanism,
  MeetingLocation,
  MeetingConfidentiality,
  BOOL,
} from "@/modules/shared/features/meeting-request-form/shared/types/enums";
import { useVisibilityCleanup } from "@/modules/shared/features/meeting-request-form/shared/hooks/useVisibilityCleanup";

interface UseCalendarMeetingFormOptions {
  initialStartDate?: string;
  initialEndDate?: string;
  initialChannel?: string;
  initialLocation?: string;
  initialTitle?: string;
}

export function useCalendarMeetingForm(options: UseCalendarMeetingFormOptions = {}) {
  const defaults: CalendarMeetingValues = {
    meeting_title: options.initialTitle ?? "",
    description: "",
    meeting_type: MeetingType.EXTERNAL,
    sector: "",
    meeting_channel: (options.initialChannel as AttendanceMechanism) ?? AttendanceMechanism.PHYSICAL,
    meeting_location: options.initialLocation ?? "",
    meeting_location_custom: "",
    meeting_confidentiality: MeetingConfidentiality.NORMAL,
    meeting_classification: "",
    is_urgent: BOOL.FALSE,
    urgent_reason: "",
    meeting_start_date: options.initialStartDate ?? "",
    meeting_end_date: options.initialEndDate ?? "",
    note: "",
  };

  const form = useForm<CalendarMeetingValues>({
    resolver: zodResolver(calendarMeetingSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const watched = form.watch();

  const visibility = useMemo(() => ({
    sector: watched.meeting_type === MeetingType.INTERNAL,
    meeting_location: [AttendanceMechanism.PHYSICAL, AttendanceMechanism.HYBRID].includes(watched.meeting_channel),
    meeting_location_custom: watched.meeting_location === MeetingLocation.OTHER,
    urgent_reason: watched.is_urgent === BOOL.TRUE,
  }), [
    watched.meeting_type,
    watched.meeting_channel,
    watched.meeting_location,
    watched.is_urgent,
  ]);

  const FIELD_RESET_MAP = useMemo(() => ({
    sector: ["sector"],
    meeting_location: ["meeting_location", "meeting_location_custom"],
    meeting_location_custom: ["meeting_location_custom"],
    urgent_reason: ["urgent_reason"],
  }), []);

  useVisibilityCleanup(form, visibility, FIELD_RESET_MAP);

  return { form, visibility, watched };
}
