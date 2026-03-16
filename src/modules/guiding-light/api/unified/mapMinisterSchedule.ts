import type {
  MinisterScheduleResponse,
  MinisterScheduleMeeting,
  MinisterScheduleBreak,
  MinisterScheduleAgendaItem,
  MinisterScheduleAttachment,
  DistributionBySectorItem,
} from "./types";
import { Sector } from "./types";
import type { GroupedMeetings } from "./types";
import {
  type DetailedMeeting,
  type MeetingCategory,
  type MeetingClassification,
  MEETING_CLASSIFICATION_LABELS,
  type MeetingTag,
  type ChartSegment,
  type Attendee,
  type AgendaItem,
  type MeetingAttachment,
} from "@gl/types/meeting-detail";
import type { Meeting } from "@gl/types/schedule";

/** Colorful palette for donut charts */
const DONUT_CHART_COLORS = [
  "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
  "#ec4899", "#f97316", "#6366f1", "#84cc16", "#e11d48",
  "#0ea5e9", "#a855f7", "#eab308", "#14b8a6", "#d946ef", "#0891b2",
];

/** Colorful palette for sector bars */
const SECTOR_BAR_COLORS = [
  "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
  "#ec4899", "#f97316", "#6366f1", "#84cc16",
];

const API_TYPE_TO_CATEGORY: Record<string, MeetingCategory> = {
  INTERNAL: "internal",
  EXTERNAL: "external",
  BUSINESS_OWNER: "private",
  PRIVATE: "private",
  NEW: "new",
  "LATE-PRIORITY": "late-priority",
};

/** Arabic label for النوع pill so it doesn’t duplicate التصنيف (e.g. BUSINESS_OWNER → صاحب الأعمال, not خاص) */
const API_TYPE_TO_TYPE_LABEL: Record<string, string> = {
  INTERNAL: "داخلي",
  EXTERNAL: "خارجي",
  BUSINESS_OWNER: "صاحب الأعمال",
  PRIVATE: "خاص",
  NEW: "جديد",
  "LATE-PRIORITY": "أولوية متأخرة",
};

const API_TAG_TO_TAG: Record<string, MeetingTag> = {
  "يتضمن محتوى": "has-content",
  "مجالس ولجان": "councils",
  "مركز الحكومة": "government-center",
  "اتصال مرئي": "video-call",
  "يتطلب بروتوكول": "requires-protocol",
};

const MEETING_TAG_WHITELIST: MeetingTag[] = [
  "councils",
  "government-center",
  "video-call",
  "requires-protocol",
  "has-content",
];

const TAG_LATE_PRIORITY = "اجتماع ذو أولوية متأخرة";

function toCategory(
  apiType: string | undefined,
  apiTags: string[] | undefined
): MeetingCategory {
  if (Array.isArray(apiTags) && apiTags.includes(TAG_LATE_PRIORITY))
    return "late-priority";
  if (!apiType) return "internal";
  const normalized = apiType.toUpperCase().replace(/\s+/g, "_");
  return API_TYPE_TO_CATEGORY[normalized] ?? API_TYPE_TO_CATEGORY[apiType] ?? "internal";
}

function toTags(apiTags: string[] | undefined): MeetingTag[] {
  if (!Array.isArray(apiTags)) return [];
  const mapped = apiTags
    .map((t) => API_TAG_TO_TAG[t] ?? (MEETING_TAG_WHITELIST.includes(t as MeetingTag) ? t : null))
    .filter((t): t is MeetingTag => t != null);
  return [...new Set(mapped)];
}

function toAttendees(api: MinisterScheduleMeeting["attendees"]): Attendee[] {
  if (!Array.isArray(api)) return [];
  return api.map((a, i) => ({
    id: a?.id ?? `a-${i}`,
    name: a?.name ?? "",
    avatar: a?.avatar ?? "",
    role: a?.role,
    group: a?.group,
    consultant: a?.consultant,
  }));
}

function toAttachments(api: MinisterScheduleMeeting["attachments"]): MeetingAttachment[] {
  if (!Array.isArray(api)) return [];
  return api
    .filter((a): a is MinisterScheduleAttachment => a != null && !!(a.id ?? a.file_name))
    .map((a) => ({
      id: a.id ?? `att-${a.file_name ?? ""}`,
      file_name: a.file_name ?? "",
      blob_url: a.blob_url,
      file_size: a.file_size,
      file_type: a.file_type,
      is_presentation: Boolean(a.is_presentation),
      is_additional: Boolean(a.is_additional),
      is_executive_summary: Boolean(a.is_executive_summary),
    }));
}

function mapAgendaItemsToUI(
  items: MinisterScheduleMeeting["agenda_items"]
): AgendaItem[] {
  if (!Array.isArray(items)) return [];
  const withOrder = items.map((item, index) => {
    if (typeof item === "string") {
      return { heading: "", description: item, order: index };
    }
    const obj = item as MinisterScheduleAgendaItem;
    const description = obj.agenda_item ?? "";
    const type = obj.minister_support_type ?? undefined;
    const durationMinutes =
      obj.presentation_duration_minutes != null ? obj.presentation_duration_minutes : undefined;
    return { heading: "", description, type, order: obj.order ?? index, durationMinutes };
  });
  return withOrder
    .filter((a) => a.description)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(({ heading, description, type, durationMinutes }) => ({ heading, description, type, durationMinutes }));
}

function breakAfterForMeeting(
  meetingId: string,
  breaks: MinisterScheduleBreak[]
): number | undefined {
  const b = breaks.find((x) => x.after_meeting_id === meetingId);
  return b?.duration_minutes;
}


export function apiMeetingToDetailedMeeting(
  m: MinisterScheduleMeeting,
  breaks: MinisterScheduleBreak[],
  index = 0,
  meetingDate?: string
): DetailedMeeting {
  const title = m.title ?? "";
  const time = m.start_time ?? m.end_time ?? "";
  const duration =
    m.duration_minutes != null ? `${m.duration_minutes} دقيقة` : "—";

  const raw =
    (m.meeting_classification_type ?? m.classification)?.toUpperCase() as MeetingClassification | undefined;
  const validClassification =
    raw === "STRATEGIC" || raw === "OPERATIONAL" || raw === "SPECIAL"
      ? raw
      : undefined;

  const apiTypeNormalized = m.type?.toUpperCase().replace(/\s+/g, "_");
  const typeLabel =
    apiTypeNormalized && API_TYPE_TO_TYPE_LABEL[apiTypeNormalized]
      ? API_TYPE_TO_TYPE_LABEL[apiTypeNormalized]
      : API_TYPE_TO_TYPE_LABEL[m.type ?? ""];

  return {
    id: m.id,
    title,
    location: m.location ?? undefined,
    communication_mode: m.communication_mode ?? undefined,
    meeting_link: m.meeting_link ?? undefined,
    category: toCategory(m.type, m.tags),
    classification: validClassification,
    meetingClassification: m.meeting_classification,
    typeLabel: typeLabel ?? undefined,
    tags: toTags(m.tags),
    tagLabels: m.tags ?? [],
    time,
    startTime: m.start_time ?? undefined,
    endTime: m.end_time ?? undefined,
    duration,
    attendees: toAttendees(m.attendees),
    internalAttendees: toAttendees(m.internal_attendees),
    externalAttendees: toAttendees(m.external_attendees),
    agenda: mapAgendaItemsToUI(m.agenda_items),
    support: (m.required_support ?? []).map((s) => ({ heading: typeof s === "string" ? s : "", description: "" })),
    attachments: toAttachments(m.attachments),
    breakAfter: breakAfterForMeeting(m.id, breaks),
    meetingDate,
  };
}

function distributionToBarSegments(
  items: DistributionBySectorItem[]
): ChartSegment[] {
  if (!Array.isArray(items)) return [];
  const sectorEnum = Sector as Record<string, string>;
  return items.map((item, i) => ({
    label:
      sectorEnum[item.sector ?? ""] ??
      sectorEnum[item.label ?? ""] ??
      item.label ??
      item.sector ??
      "—",
    value: item.value ?? item.count ?? 0,
    color: item.color ?? SECTOR_BAR_COLORS[i % SECTOR_BAR_COLORS.length],
  }));
}

/** API type key → Arabic label for donut "حسب النوع". */
const MEETING_TYPE_LABELS: Record<string, string> = {
  INTERNAL: "داخلي",
  EXTERNAL: "خارجي",
  BUSINESS_OWNER: "أعمال",
  PRIVATE: "خاص",
  NEW: "جديد",
  "LATE-PRIORITY": "أولوية متأخرة",
};

/** API meeting_classification key → Arabic label for donut "حسب الفئة". */
const MEETING_CATEGORY_LABELS: Record<string, string> = {
  COUNCILS_AND_COMMITTEES: "المجالس واللجان",
  EVENTS_AND_VISITS: "الفعاليات والزيارات",
  BILATERAL_MEETING: "لقاء ثنائي",
  PRIVATE_MEETING: "لقاء خاص",
  BUSINESS: "أعمال",
  GOVERNMENT_CENTER_TOPICS: "مواضيع مركز الحكومة",
  DISCUSSION_WITHOUT_PRESENTATION: "مناقشة بدون عرض تقديمي",
  // Compound keys from API (classification + type)
  COUNCILS_AND_COMMITTEES_INTERNAL: "المجالس واللجان - داخلي",
  COUNCILS_AND_COMMITTEES_EXTERNAL: "المجالس واللجان - خارجي",
  EVENTS_AND_VISITS_INTERNAL: "الفعاليات والزيارات - داخلي",
  EVENTS_AND_VISITS_EXTERNAL: "الفعاليات والزيارات - خارجي",
  BILATERAL_MEETING_INTERNAL: "لقاء ثنائي - داخلي",
  BILATERAL_MEETING_EXTERNAL: "لقاء ثنائي - خارجي",
  PRIVATE_MEETING_INTERNAL: "لقاء خاص - داخلي",
  PRIVATE_MEETING_EXTERNAL: "لقاء خاص - خارجي",
  BUSINESS_INTERNAL: "أعمال - داخلي",
  BUSINESS_EXTERNAL: "أعمال - خارجي",
  GOVERNMENT_CENTER_TOPICS_INTERNAL: "مواضيع مركز الحكومة - داخلي",
  GOVERNMENT_CENTER_TOPICS_EXTERNAL: "مواضيع مركز الحكومة - خارجي",
};

/** Try to translate an unknown API key by splitting and looking up parts */
function translateApiKey(key: string): string {
  // Try suffix: _INTERNAL / _EXTERNAL
  const suffixMap: Record<string, string> = { INTERNAL: "داخلي", EXTERNAL: "خارجي" };
  for (const [suffix, label] of Object.entries(suffixMap)) {
    if (key.endsWith(`_${suffix}`)) {
      const base = key.slice(0, -(suffix.length + 1));
      const baseLabel = MEETING_CATEGORY_LABELS[base] ?? MEETING_TYPE_LABELS[base] ?? (MEETING_CLASSIFICATION_LABELS as Record<string, string>)[base];
      if (baseLabel) return `${baseLabel} - ${label}`;
    }
  }
  return key.replace(/_/g, " ").toLowerCase();
}

/** Build donut segments from API grouped object; order keys by provided order, label via map. */
function groupedToSegments(
  grouped: GroupedMeetings | undefined,
  keyOrder: string[],
  labelMap: Record<string, string>,
  colors: string[]
): ChartSegment[] {
  if (!grouped || typeof grouped !== "object") return [];
  return keyOrder
    .filter((key) => grouped[key]?.length)
    .map((key, i) => ({
      label: labelMap[key] ?? translateApiKey(key),
      value: grouped[key].length,
      color: colors[i % colors.length],
    }));
}

/** Donut "حسب التصنيف" from API grouped_by_classification_type (STRATEGIC, OPERATIONAL, SPECIAL). */
function donutDataByClassificationFromResponse(res: MinisterScheduleResponse): ChartSegment[] {
  const order: MeetingClassification[] = ["STRATEGIC", "OPERATIONAL", "SPECIAL"];
  return groupedToSegments(
    res.grouped_by_classification_type,
    order,
    MEETING_CLASSIFICATION_LABELS as Record<string, string>,
    DONUT_CHART_COLORS
  );
}

/** Donut "حسب النوع" from API grouped_by_type. */
function donutDataByTypeFromResponse(res: MinisterScheduleResponse): ChartSegment[] {
  const grouped = res.grouped_by_type;
  if (!grouped || typeof grouped !== "object") return [];
  const order = ["INTERNAL", "EXTERNAL", "BUSINESS_OWNER", "PRIVATE", "NEW", "LATE-PRIORITY"];
  const seen = new Set<string>();
  const segments: ChartSegment[] = [];
  for (const key of order) {
    const arr = grouped[key];
    if (arr?.length && !seen.has(key)) {
      seen.add(key);
      segments.push({
        label: MEETING_TYPE_LABELS[key] ?? translateApiKey(key),
        value: arr.length,
        color: DONUT_CHART_COLORS[segments.length % DONUT_CHART_COLORS.length],
      });
    }
  }
  for (const key of Object.keys(grouped)) {
    if (seen.has(key)) continue;
    const arr = grouped[key];
    if (arr?.length) {
      segments.push({
        label: MEETING_TYPE_LABELS[key] ?? translateApiKey(key),
        value: arr.length,
        color: DONUT_CHART_COLORS[segments.length % DONUT_CHART_COLORS.length],
      });
    }
  }
  return segments;
}

/** Donut "حسب الفئة" from API grouped_by_classification. */
function donutDataByCategoryFromResponse(res: MinisterScheduleResponse): ChartSegment[] {
  const grouped = res.grouped_by_classification;
  if (!grouped || typeof grouped !== "object") return [];
  const order = [
    "COUNCILS_AND_COMMITTEES",
    "EVENTS_AND_VISITS",
    "BILATERAL_MEETING",
    "PRIVATE_MEETING",
    "BUSINESS",
    "GOVERNMENT_CENTER_TOPICS",
  ];
  const segments: ChartSegment[] = [];
  for (const key of order) {
    const arr = grouped[key];
    if (arr?.length) {
      segments.push({
        label: MEETING_CATEGORY_LABELS[key] ?? translateApiKey(key),
        value: arr.length,
        color: DONUT_CHART_COLORS[segments.length % DONUT_CHART_COLORS.length],
      });
    }
  }
  for (const key of Object.keys(grouped)) {
    if (order.includes(key)) continue;
    const arr = grouped[key];
    if (arr?.length) {
      segments.push({
        label: MEETING_CATEGORY_LABELS[key] ?? translateApiKey(key),
        value: arr.length,
        color: DONUT_CHART_COLORS[segments.length % DONUT_CHART_COLORS.length],
      });
    }
  }
  return segments;
}

/** Map API minister schedule response to UI shapes */
export function mapMinisterScheduleToUI(
  res: MinisterScheduleResponse
): {
  detailedMeetings: DetailedMeeting[];
  notificationMeetings: Meeting[];
  donutDataByClassification: ChartSegment[];
  donutDataByType: ChartSegment[];
  donutDataByCategory: ChartSegment[];
  barData: ChartSegment[];
  totalMeetings: number;
  totalNotifications: number;
} {
  const breaks = res.breaks ?? [];
  const scheduleDate = res.date; // YYYY-MM-DD
  const detailedMeetings = (res.meetings ?? []).map((m, i) =>
    apiMeetingToDetailedMeeting(m, breaks, i, scheduleDate)
  );

  const notificationMeetings: Meeting[] = detailedMeetings.map((m) => ({
    id: m.id,
    title: m.title,
    location: m.location ?? "",
    time: new Date(0),
    formattedTime: m.time,
    status: "confirmed",
  }));

  const distribution = res.summary?.distribution_by_sector ?? [];
  const barData = distributionToBarSegments(distribution);
  const totalMeetings = res.summary?.total_meetings ?? detailedMeetings.length;
  const totalNotifications = res.summary?.total_notifications ?? 0;

  // Donut data from API grouped_* (no client-side grouping)
  const donutDataByClassification = donutDataByClassificationFromResponse(res);
  const donutDataByType = donutDataByTypeFromResponse(res);
  const donutDataByCategory = donutDataByCategoryFromResponse(res);

  return {
    detailedMeetings,
    notificationMeetings,
    donutDataByClassification,
    donutDataByType,
    donutDataByCategory,
    barData,
    totalMeetings,
    totalNotifications,
  };
}
