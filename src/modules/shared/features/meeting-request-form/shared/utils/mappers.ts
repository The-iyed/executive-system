import { TableRow } from "@/lib/dynamic-table-form";
import { toISOStringWithTimezoneFromString } from "@/lib/ui";
import type { ExistingAttachment, Step2ContentInitialData } from "../hooks/useStep2Content";
import { BOOL, MeetingType, AttendanceMechanism, MeetingConfidentiality, MeetingNature } from "../types/enums";
import type { SubmitterStep1Values } from "../../submitter/schema";

/* ─── Helpers ─── */

function formatDateStringToISO(value: string): string {
  if (!value) return "";
  try {
    return toISOStringWithTimezoneFromString(value);
  } catch {
    return value;
  }
}

function normalizeMeetingConfidentiality(
  value: unknown,
): SubmitterStep1Values["meeting_confidentiality"] {
  return value === MeetingConfidentiality.CONFIDENTIAL
    ? MeetingConfidentiality.CONFIDENTIAL
    : MeetingConfidentiality.NORMAL;
}

/* ─── Draft API attachment shape ─── */

interface DraftAttachment {
  id: string;
  file_name: string;
  blob_url?: string;
  file_size?: number;
  file_type?: string;
  is_presentation?: boolean;
  is_additional?: boolean;
  is_executive_summary?: boolean;
  presentation_sequence?: number;
  version?: number;
  is_latest?: boolean;
}

interface DraftApiResponse {
  attachments?: DraftAttachment[];
  can_upload_more_than_one?:boolean;
  [key: string]: unknown;
}

/* ─── Step 2 Content Mapper ─── */

export function transformDraftToStep2ContentData(
  draft: DraftApiResponse,
): Step2ContentInitialData {
  const attachments = draft.attachments ?? [];

  const existingPresentations: ExistingAttachment[] = attachments
    .filter((a) => a.is_presentation && !a.is_executive_summary)
    .map((att): ExistingAttachment => ({
      id: att.id,
      file_name: att.file_name,
      blob_url: att.blob_url,
      file_size: att.file_size,
      file_type: att.file_type,
      presentation_sequence: att.presentation_sequence,
    }));

  const existingAdditionalFiles: ExistingAttachment[] = attachments
    .filter((a) => a.is_additional)
    .map((att): ExistingAttachment => ({
      id: att.id,
      file_name: att.file_name,
      blob_url: att.blob_url,
      file_size: att.file_size,
      file_type: att.file_type,
    }));

  const hasExecutiveSummary = attachments.some((a) => a.is_executive_summary);

  return {
    existingPresentations,
    existingAdditionalFiles,
    can_upload_more_than_one: draft?.can_upload_more_than_one,
    hasExecutiveSummary,
  };
}

/* ─── Step 3 Invitees Mapper ─── */

interface DraftInvitee {
  object_guid?: string;
  email?: string;
  position?: string;
  mobile?: string;
  sector?: string;
  attendance_mechanism?: string;
  access_permission?: boolean;
  is_consultant?: boolean;
  meeting_owner?: boolean;
  [key: string]: unknown;
}

export function transformDraftToInvitees(
  draft: Record<string, unknown>,
): TableRow[] {
  const invitees = Array.isArray(draft.invitees) ? draft.invitees as DraftInvitee[] : [];

  return invitees.map((inv, idx) => ({
    id: inv.id || undefined,
    _id: inv.object_guid || `draft-inv-${idx}`,
    object_guid: inv.object_guid || "",
    email: inv.email || "",
    position: inv.position || "",
    mobile: inv.mobile || "",
    sector: inv.sector || "",
    attendance_mechanism: inv.attendance_mechanism || "",
    access_permission: inv.access_permission ?? false,
    is_consultant: inv.is_consultant ?? false,
    meeting_owner: inv.meeting_owner ?? false,
    isExternal: !inv.object_guid,
    _disabledFields: inv.object_guid ? ["email"] : [],
  }));
}

/* ─── Step 1 Mapper ─── */

/** Mapped step-1 values enriched with display-only metadata */
export type MappedSubmitterStep1Values = SubmitterStep1Values & {
  /** Display name for meeting_owner (used as fallback before options load) */
  meeting_manager_name?: string;
};

export function mapMeetingToSubmitterStep1(meeting: Record<string, unknown>): MappedSubmitterStep1Values {
  const agendaItems = Array.isArray(meeting.agenda_items) && meeting.agenda_items.length > 0
    ? meeting.agenda_items.map((item: Record<string, unknown>) => ({
        agenda_item: (item.agenda_item as string) || "",
        presentation_duration_minutes: (item.presentation_duration_minutes as number) || 0,
        minister_support_type: (item.minister_support_type as string) || "",
        minister_support_other: (item.minister_support_other as string) || "",
      }))
    : [];

  const selectedSlot = meeting.selected_time_slot as Record<string, unknown> | null;

  const rawMeetingOwner = meeting.meeting_owner;
  const meetingOwner =
    rawMeetingOwner && typeof rawMeetingOwner === "object"
      ? (rawMeetingOwner as SubmitterStep1Values["meeting_owner"])
      : null;

  const meetingNature = (meeting.meeting_nature as string) || MeetingNature.NORMAL;

  // Map prev_ext_id back to previous_meeting_id for form usage
  const previousMeetingId = meeting.prev_ext_id != null
    ? String(meeting.prev_ext_id)
    : (meeting.previous_meeting_id != null ? String(meeting.previous_meeting_id) : "");

  const values: SubmitterStep1Values = {
    meeting_nature: meetingNature as SubmitterStep1Values["meeting_nature"],
    previous_meeting_id: previousMeetingId,
    group_id: (meeting.group_id as number) ?? null,
    prev_ext_original_title: (meeting.prev_ext_original_title as string) ?? null,
    prev_ext_meeting_title: (meeting.prev_ext_meeting_title as string) ?? null,
    meeting_title: (meeting.meeting_title as string) || "",
    meeting_subject: (meeting.meeting_subject as string) || "",
    description: (meeting.description as string) || "",
    meeting_type: ((meeting.meeting_type as string) || MeetingType.INTERNAL) as SubmitterStep1Values["meeting_type"],
    sector: (meeting.sector as string) || "",
    meeting_classification: (meeting.meeting_classification as string) || "",
    meeting_sub_category: meeting.meeting_sub_category as string || "",
    meeting_justification: (meeting.meeting_justification as string) || "",
    related_topic: (meeting.related_topic as string) || "",
    deadline: (meeting.deadline as string) || "",
    meeting_classification_type: (meeting.meeting_classification_type as string) || "",
    meeting_confidentiality: normalizeMeetingConfidentiality(meeting.meeting_confidentiality),
    meeting_channel: ((meeting.meeting_channel as string) || AttendanceMechanism.PHYSICAL) as SubmitterStep1Values["meeting_channel"],
    meeting_location: (meeting.meeting_location as string) || "",
    meeting_location_custom: (meeting?.meeting_location_custom as string) || "",
    is_urgent: meeting.is_urgent === true ? BOOL.TRUE : BOOL.FALSE,
    urgent_reason: (meeting.urgent_reason as string) || "",
    is_on_behalf_of: meeting.is_on_behalf_of === true ? BOOL.TRUE : BOOL.FALSE,
    meeting_owner: meetingOwner,
    meeting_start_date:
      (selectedSlot?.slot_start as string) ||
      (meeting.meeting_start_date as string) ||
      ((meeting.scheduled_start as string) || ""),
    meeting_end_date:
      (selectedSlot?.slot_end as string) ||
      (meeting.meeting_end_date as string) ||
      ((meeting.scheduled_end as string) || ""),
    agenda_items: agendaItems,
    note: (meeting.note as string) || "",
    is_based_on_directive: meeting.is_based_on_directive === true ? BOOL.TRUE : BOOL.FALSE,
    directive_method: meeting.is_based_on_directive === true
      ? ((meeting.directive_method as SubmitterStep1Values["directive_method"]) || undefined)
      : undefined,
    previous_meeting_minutes_file_content: "",
    directive_text: (meeting?.directive_text as string) || "",
  };

  // Scheduler-only fields
  const rawSubmitter = meeting.submitter;
  const submitter =
    rawSubmitter && typeof rawSubmitter === "object"
      ? (rawSubmitter as SubmitterStep1Values["submitter"])
      : null;

  return {
    ...values,
    submitter,
    requires_protocol: meeting.requires_protocol === true ? BOOL.TRUE : BOOL.FALSE,
    related_directive: (meeting.related_directive as string) || "",
  };
}