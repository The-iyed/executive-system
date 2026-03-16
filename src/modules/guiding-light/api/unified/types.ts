/**
 * Types for the Minister Schedule API
 * GET /api/meetings/minister/schedule?date=YYYY-MM-DD&view=daily
 */

/** Sector keys and Arabic labels for display (erasable-safe replacement for enum) */
export const Sector = {
  MUNICIPAL_AFFAIRS: "شؤون البلديات",
  HOUSING_AFFAIRS: "شؤون الإسكان",
  EMPOWERMENT_AND_COMPLIANCE: "التمكين والإمتثال",
  PLANNING_AND_DEVELOPMENT: "التخطيط والتطوير",
  SUPPORT_SERVICES: "الخدمات المساندة",
  MINISTER_AFFILIATED: "الجهات التابعة لمعالي الوزير",
} as const;

export type SectorKey = keyof typeof Sector;

export interface DistributionByClassificationItem {
  label?: string;
  value?: number;
  count?: number;
}

export interface MinisterScheduleSummary {
  total_meetings: number;
  total_notifications: number;
  distribution_by_sector: DistributionBySectorItem[];
  distribution_by_classification?: DistributionByClassificationItem[];
}

export interface DistributionBySectorItem {
  /** Display label (Arabic). Prefer this when present. */
  label?: string;
  /** Sector key from API (e.g. Sector key). Resolved to label via Sector when needed. */
  sector?: string;
  color?: string;
  value?: number;
  count?: number;
}

export interface MinisterScheduleBreak {
  after_meeting_id: string;
  duration_minutes: number;
  label?: string;
}

/** Agenda item from API (object shape). */
export interface MinisterScheduleAgendaItem {
  id?: string;
  agenda_item?: string;
  order?: number;
  presentation_duration_minutes?: number;
  minister_support_type?: string | null;
  minister_support_other?: string | null;
}

/** Meeting attachment from API. */
export interface MinisterScheduleAttachment {
  id?: string;
  file_name?: string;
  blob_name?: string;
  blob_url?: string;
  file_size?: number;
  file_type?: string;
  content_type?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  is_presentation?: boolean;
  is_additional?: boolean;
  is_executive_summary?: boolean;
  version?: number;
  is_latest?: boolean;
  etag?: string | null;
  replaces_attachment_id?: string | null;
}

export interface MinisterScheduleMeeting {
  id: string;
  title?: string;
  type?: string;
  /** Classification type from API: STRATEGIC | OPERATIONAL | SPECIAL */
  meeting_classification_type?: string;
  /** Category from API: EVENTS_AND_VISITS | COUNCILS_AND_COMMITTEES | etc. */
  meeting_classification?: string;
  /** Alias used by some responses */
  classification?: string;
  tags?: string[];
  location?: string | null;
  communication_mode?: string;
  meeting_link?: string | null;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  /** Agenda: array of objects (new) or legacy string[] */
  agenda_items?: MinisterScheduleAgendaItem[] | string[];
  required_support?: string[];
  attendees?: MinisterScheduleAttendee[];
  attendees_count?: number;
  internal_attendees?: MinisterScheduleAttendee[];
  external_attendees?: MinisterScheduleAttendee[];
  attachments?: MinisterScheduleAttachment[];
}

export interface MinisterScheduleAttendee {
  id?: string;
  name?: string;
  role?: string;
  group?: string;
  avatar?: string;
  email?: string;
  consultant?: boolean;
}

/** Grouped meetings from API; keys are enum values (e.g. SPECIAL, BUSINESS_OWNER, EVENTS_AND_VISITS). */
export type GroupedMeetings = Record<string, MinisterScheduleMeeting[]>;

export interface MinisterScheduleResponse {
  date: string;
  view: string;
  summary: MinisterScheduleSummary;
  meetings: MinisterScheduleMeeting[];
  breaks: MinisterScheduleBreak[];
  /** Group by classification type: STRATEGIC | OPERATIONAL | SPECIAL */
  grouped_by_classification_type?: GroupedMeetings;
  /** Group by meeting type: INTERNAL | EXTERNAL | BUSINESS_OWNER | etc. */
  grouped_by_type?: GroupedMeetings;
  /** Group by meeting classification (category): EVENTS_AND_VISITS | COUNCILS_AND_COMMITTEES | etc. */
  grouped_by_classification?: GroupedMeetings;
}
