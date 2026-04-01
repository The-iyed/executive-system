/** Meeting classification enum (API/storage). Display: استراتيجي، تشغيلي، خاص */
export type MeetingClassification = "STRATEGIC" | "OPERATIONAL" | "SPECIAL";

export const MEETING_CLASSIFICATION_LABELS: Record<MeetingClassification, string> = {
  STRATEGIC: "استراتيجي",
  OPERATIONAL: "تشغيلي",
  SPECIAL: "خاص",
};

/** Generic classification/mode labels (e.g. for assessment mode: Hybrid → هجين). */
export const CLASSIFICATION_LABELS: Record<string, string> = {
  ...MEETING_CLASSIFICATION_LABELS,
  HYBRID: "هجين",
  PHYSICAL: "حضوري",
  VIRTUAL: "عن بُعد",
};

/** API meeting_classification (الفئة) key → Arabic label for card badge */
export const MEETING_CATEGORY_API_LABELS: Record<string, string> = {
  COUNCILS_AND_COMMITTEES: "المجالس واللجان",
  EVENTS_AND_VISITS: "الفعاليات والزيارات",
  BILATERAL_MEETING: "لقاء ثنائي",
  PRIVATE_MEETING: "لقاء خاص",
  BUSINESS: "أعمال",
  GOVERNMENT_CENTER_TOPICS: "مواضيع مركز الحكومة",
};

export type MeetingCategory =
  | "internal"
  | "external"
  | "private"
  | "new"
  | "late-priority";

export type MeetingTag =
  | "councils"
  | "government-center"
  | "video-call"
  | "requires-protocol"
  | "has-content";

export interface Attendee {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  group?: string;
  email?: string;
  is_meeting_owner?: boolean;
  consultant?: boolean;
}

export interface AgendaItem {
  heading: string;
  description: string;
  /** Optional label for the pill, e.g. "إحاطة", "تحديث", "قرار" */
  type?: string;
  /** Duration in minutes from API (presentation_duration_minutes) for this item */
  durationMinutes?: number;
}

export interface MeetingAttachment {
  id: string;
  file_name: string;
  blob_url?: string;
  file_size?: number;
  file_type?: string;
  is_presentation?: boolean;
  is_additional?: boolean;
  is_executive_summary?: boolean;
}

export interface DetailedMeeting {
  id: string;
  title: string;
  location?: string;
  /** PHYSICAL | VIRTUAL — when PHYSICAL show location; when VIRTUAL show meeting_link as link */
  communication_mode?: string;
  /** When communication_mode is VIRTUAL, show this as "اتصال مرئي" link */
  meeting_link?: string;
  category: MeetingCategory;
  /** Classification: STRATEGIC (استراتيجي), OPERATIONAL (تشغيلي), SPECIAL (خاص) */
  classification?: MeetingClassification;
  /** Category key from API for "الفئة" badge: EVENTS_AND_VISITS, COUNCILS_AND_COMMITTEES, etc. */
  meetingClassification?: string;
  /** Display label for النوع pill (e.g. "صاحب الأعمال" for BUSINESS_OWNER) to avoid duplicating classification label */
  typeLabel?: string;
  tags: MeetingTag[];
  /** Raw API tag strings for display (e.g. "يتطلب بروتوكول", "يتضمن محتوى") */
  tagLabels?: string[];
  goal?: string;
  time: string;
  /** Start time for agenda titles, e.g. "09:10" */
  startTime?: string;
  /** End time for agenda titles, e.g. "09:50" */
  endTime?: string;
  duration: string;
  attendees: Attendee[];
  /** When present, shown as "الحضور الداخليين" section; else fall back to attendees */
  internalAttendees?: Attendee[];
  /** When present, shown as "الحضور الخارجيين" section */
  externalAttendees?: Attendee[];
  agenda?: AgendaItem[];
  support?: AgendaItem[];
  attachments?: MeetingAttachment[];
  breakAfter?: number;
  /** Whether this is an important meeting */
  isImportant?: boolean;
  /** Whether this is a priority meeting */
  isPriority?: boolean;
  /** AI relevance/importance score 0-100 */
  relevanceScore?: number;
  /** AI recommended delegatee name for inline display */
  aiDelegateeRecommendation?: string;
  /** Full date string (YYYY-MM-DD) for determining if meeting is in the past */
  meetingDate?: string;
}

export interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

export interface DailyBarEntry {
  dayName: string;
  segments: { value: number; color: string }[];
}
