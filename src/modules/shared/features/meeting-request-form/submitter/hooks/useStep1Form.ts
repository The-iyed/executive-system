import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitterStep1Schema, type SubmitterStep1Values } from "../schema";
import {
  MeetingType,
  AttendanceMechanism,
  MeetingClassification,
  MeetingLocation,
  BOOL,
  MeetingConfidentiality,
  MeetingNature,
} from "../../shared/types/enums";
import { useVisibilityCleanup } from "../../shared";

export function useSubmitterStep1Form(initialValues?: Partial<SubmitterStep1Values>, options?: { isSchedulerEdit?: boolean }) {
  const defaults: SubmitterStep1Values = {
    meeting_nature: MeetingNature.NORMAL,
    previous_meeting_id: "",
    meeting_title: "",
    meeting_subject: "",
    description: "",
    meeting_type: MeetingType.EXTERNAL,
    sector: "",
    meeting_classification: "",
    meeting_sub_category: "",
    meeting_justification: "",
    related_topic: "",
    deadline: "",
    meeting_classification_type: "",
    meeting_confidentiality: MeetingConfidentiality.NORMAL,
    meeting_channel: AttendanceMechanism.PHYSICAL,
    meeting_location: "",
    meeting_location_custom: "",
    is_urgent: BOOL.FALSE,
    urgent_reason: "",
    is_on_behalf_of: BOOL.FALSE,
    meeting_start_date: "",
    meeting_end_date: "",
    agenda_items: [],
    note: "",
    is_based_on_directive: BOOL.FALSE,
    directive_method: undefined,
    previous_meeting_minutes_file_content: "",
    directive_text: "",
    submitter: null,
    requires_protocol: BOOL.FALSE,
    related_directive: "",
    ...initialValues,
  };

  // When meeting_owner exists, force on-behalf to true
  if (initialValues?.meeting_owner && typeof initialValues.meeting_owner === 'object') {
    defaults.is_on_behalf_of = BOOL.TRUE;
  }

  const form = useForm<SubmitterStep1Values>({
    resolver: zodResolver(submitterStep1Schema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const watched = form.watch();

  const visibility = useMemo(() => ({
    previous_meeting_id: [MeetingNature.SEQUENTIAL, MeetingNature.PERIODIC].includes(watched.meeting_nature),
    sector: watched.meeting_type === MeetingType.INTERNAL,
    meeting_location: [AttendanceMechanism.PHYSICAL, AttendanceMechanism.HYBRID].includes(watched.meeting_channel),
    meeting_location_custom: watched.meeting_location === MeetingLocation.OTHER,
    urgent_reason: watched.is_urgent === BOOL.TRUE,
    meeting_owner: watched.is_on_behalf_of === BOOL.TRUE,
    meeting_justification: [
      MeetingClassification.PRIVATE_MEETING,
      MeetingClassification.BILATERAL_MEETING,
    ].includes(watched.meeting_classification as MeetingClassification),
    related_topic: watched.meeting_classification === MeetingClassification.GOVERNMENT_CENTER_TOPICS,
    deadline: watched.meeting_classification === MeetingClassification.GOVERNMENT_CENTER_TOPICS,
    meeting_classification_type: watched.meeting_classification === MeetingClassification.BUSINESS,
    meetingSubCategory: [
      MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL,
      MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL,
    ].includes(watched.meeting_classification as MeetingClassification),
    directive_method: watched.is_based_on_directive === BOOL.TRUE,
    previous_meeting_minutes_file_content: watched.directive_method === "PREVIOUS_MEETING",
    directive_text: watched.directive_method === "DIRECT_DIRECTIVE",
  }), [
    watched.meeting_nature,
    watched.meeting_type,
    watched.meeting_channel,
    watched.meeting_location,
    watched.is_urgent,
    watched.is_on_behalf_of,
    watched.meeting_classification,
    watched.is_based_on_directive,
    watched.directive_method,
  ]);

  // Clean up hidden field values when visibility toggles off
  const SUBMITTER_FIELD_RESET_MAP = useMemo(() => ({
    previous_meeting_id: ["previous_meeting_id", { name: "group_id", resetValue: null }, { name: "prev_ext_original_title", resetValue: null }, { name: "prev_ext_meeting_title", resetValue: null }],
    sector: ["sector"],
    meeting_location: ["meeting_location", "meeting_location_custom"],
    meeting_location_custom: ["meeting_location_custom"],
    urgent_reason: ["urgent_reason"],
    meeting_owner: [{ name: "meeting_owner", resetValue: null }],
    meeting_justification: ["meeting_justification"],
    related_topic: ["related_topic"],
    deadline: ["deadline"],
    meeting_classification_type: ["meeting_classification_type"],
    meetingSubCategory: ["meeting_sub_category"],
    directive_method: [
      { name: "directive_method", resetValue: undefined },
      "directive_text",
      { name: "previous_meeting_minutes_file_content", resetValue: undefined },
    ],
    previous_meeting_minutes_file_content: [{ name: "previous_meeting_minutes_file_content", resetValue: undefined }],
    directive_text: ["directive_text"],
  }), []);

  useVisibilityCleanup(form, visibility, SUBMITTER_FIELD_RESET_MAP);

  return { form, visibility, watched };
}