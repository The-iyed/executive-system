import { MeetingStatus, MeetingStatusUnCommitted } from "../../../../types";
import { MeetingConfidentiality } from "./enums";

export { MeetingStatus }

export const SAVEABLE_DRAFT_STATUSES: ReadonlySet<string> = new Set([
  MeetingStatusUnCommitted.DRAFT_UNCOMMITTED,
  MeetingStatus.DRAFT,
]);

export interface AgendaItem {
  agenda_item: string;
  presentation_duration_minutes: number;
  minister_support_type: string;
  minister_support_other?: string;
}

export interface MeetingRequestPayload {
  meeting_title: string;
  meeting_subject?: string;
  description?: string;
  meeting_type: "INTERNAL" | "EXTERNAL";
  meeting_classification: string;
  meeting_justification?: string;
  related_topic?: string;
  deadline?: string;
  meeting_classification_type?: string;
  meeting_confidentiality: MeetingConfidentiality;
  meeting_channel: "PHYSICAL" | "REMOTE";
  meeting_location?: string;
  sector?: string;
  agenda_items: AgendaItem[];
  note?: string;
  is_urgent: "true" | "false";
  urgent_reason?: string;
  is_on_behalf_of: "true" | "false";
  meeting_owner?: string;
  meeting_start_date?: string;
  meeting_end_date?: string;
  is_based_on_directive: "true" | "false";
  directive_method?: "PREVIOUS_MEETING" | "DIRECT_DIRECTIVE";
  previous_meeting_minutes_file_content?: string;
  directive_text?: string;
}
