import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schedulerStep1Schema, type SchedulerStep1Values } from "./schema";
import { MeetingType, AttendanceMechanism, MeetingClassification, MeetingLocation, MeetingNature, BOOL, MeetingConfidentiality } from "../shared/types/enums";
import { useVisibilityCleanup } from "../shared";

/** Fields that stay editable when following up a previous meeting */
const FOLLOW_UP_EDITABLE = new Set([
  "meeting_nature", "submitter", "meeting_owner", "meeting_title",
  "meeting_start_date", "meeting_end_date",
  "meeting_channel", "meeting_location", "meeting_location_custom",
  "is_urgent", "urgent_reason",
]);

export function useSchedulerStep1Form(initialValues?: Partial<SchedulerStep1Values>) {
  const defaults: SchedulerStep1Values = {
    meeting_nature: MeetingNature.NORMAL,
    previous_meeting_id: "",
    submitter: null,
    meeting_owner: null,
    meeting_title: "",
    meeting_subject: "",
    description: "",
    sector: "",
    meeting_type: MeetingType.EXTERNAL,
    is_urgent: BOOL.FALSE,
    urgent_reason: "",
    meeting_start_date: "",
    meeting_end_date: "",
    meeting_channel: AttendanceMechanism.PHYSICAL,
    meeting_location: "",
    meeting_location_custom: "",
    requires_protocol: BOOL.FALSE,
    meeting_classification: "",
    meeting_sub_category: "",
    meeting_justification: "",
    related_topic: "",
    deadline: "",
    meeting_classification_type: "",
    meeting_confidentiality: MeetingConfidentiality.NORMAL,
    is_on_behalf_of: BOOL.TRUE,
    agenda_items: [],
    note: "",
    related_directive: "",
    is_data_complete: BOOL.FALSE,
    ...initialValues,
  };

  const form = useForm<SchedulerStep1Values>({
    resolver: zodResolver(schedulerStep1Schema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const watched = form.watch();

  const isFollowUp = [MeetingNature.SEQUENTIAL, MeetingNature.PERIODIC].includes(watched.meeting_nature);
  const hasFollowUpMeeting = isFollowUp && !!watched.previous_meeting_id;



  const visibility = useMemo(() => ({
    previous_meeting_id: isFollowUp,
    meeting_owner: watched.is_on_behalf_of === BOOL.TRUE,
    urgent_reason: watched.is_urgent === BOOL.TRUE,
    meeting_location: [AttendanceMechanism.PHYSICAL, AttendanceMechanism.HYBRID].includes(watched.meeting_channel),
    meeting_location_custom: watched.meeting_location === MeetingLocation.OTHER,
    meeting_justification: [MeetingClassification.PRIVATE_MEETING, MeetingClassification.BILATERAL_MEETING].includes(watched.meeting_classification as MeetingClassification),
    related_topic: watched.meeting_classification === MeetingClassification.GOVERNMENT_CENTER_TOPICS,
    deadline: watched.meeting_classification === MeetingClassification.GOVERNMENT_CENTER_TOPICS,
    meeting_classification_type: watched.meeting_classification === MeetingClassification.BUSINESS,
    meetingSubCategory: [MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL, MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL].includes(watched.meeting_classification as MeetingClassification),
  }), [watched.meeting_nature, watched.meeting_channel, watched.meeting_location, watched.is_urgent, watched.meeting_classification, watched.is_on_behalf_of]);

  // Clean up hidden field values when visibility toggles off
  const SCHEDULER_FIELD_RESET_MAP = useMemo(() => ({
    previous_meeting_id: ["previous_meeting_id", { name: "group_id", resetValue: null }, { name: "prev_ext_original_title", resetValue: null }, { name: "prev_ext_meeting_title", resetValue: null }],
    urgent_reason: ["urgent_reason"],
    meeting_location: ["meeting_location", "meeting_location_custom"],
    meeting_location_custom: ["meeting_location_custom"],
    meeting_justification: ["meeting_justification"],
    related_topic: ["related_topic"],
    deadline: ["deadline"],
    meeting_classification_type: ["meeting_classification_type"],
    meetingSubCategory: ["meeting_sub_category"],
  }), []);

  useVisibilityCleanup(form, visibility, SCHEDULER_FIELD_RESET_MAP);

  /** Check if a field should be disabled (follow-up mode) */
  const isFieldDisabled = (fieldName: string) => hasFollowUpMeeting && !FOLLOW_UP_EDITABLE.has(fieldName);

  return { form, visibility, watched, isFollowUp, hasFollowUpMeeting, isFieldDisabled };
}