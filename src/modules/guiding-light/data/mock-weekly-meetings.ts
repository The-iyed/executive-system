import type { Meeting } from "@gl/types/schedule";
import type { DailyBarEntry, DetailedMeeting } from "@gl/types/meeting-detail";

export interface WeeklyDay {
  date: Date;
  arabicDayName: string;
  arabicMonthName: string;
  meetings: Meeting[];
  /** When provided, weekly section uses DetailedMeetingCard (same as daily) */
  detailedMeetings?: DetailedMeeting[];
}

// Shared meeting template matching the design image exactly
const MEETING_TEMPLATE = {
  title: "الاجتماع (3) للمجلس التأسيسي لهيئة نيوم.",
  location: "من الغدير – قاعة الاجتماعات",
  formattedTime: "في تمام الساعة الخامسة وربع مساء | 17:15",
};

function makeMeetings(
  baseDate: Date,
  ids: string[],
  statuses: Meeting["status"][],
): Meeting[] {
  return ids.map((id, i) => ({
    id,
    title: MEETING_TEMPLATE.title,
    location: MEETING_TEMPLATE.location,
    time: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 17, 15),
    formattedTime: MEETING_TEMPLATE.formattedTime,
    status: statuses[i % statuses.length],
  }));
}

export const WEEKLY_MEETINGS_WEEK_3: WeeklyDay[] = [
  {
    date: new Date(2025, 8, 5), // Monday Sep 5
    arabicDayName: "الاثنين",
    arabicMonthName: "سبتمبر",
    meetings: makeMeetings(
      new Date(2025, 8, 5),
      ["w3-mon-1", "w3-mon-2", "w3-mon-3", "w3-mon-4"],
      ["confirmed", "confirmed", "confirmed", "confirmed"],
    ),
  },
  {
    date: new Date(2025, 8, 6), // Tuesday Sep 6
    arabicDayName: "الثلاثاء",
    arabicMonthName: "سبتمبر",
    meetings: makeMeetings(
      new Date(2025, 8, 6),
      ["w3-tue-1", "w3-tue-2", "w3-tue-3", "w3-tue-4"],
      ["confirmed", "confirmed", "confirmed", "confirmed"],
    ),
  },
  {
    date: new Date(2025, 8, 7), // Wednesday Sep 7
    arabicDayName: "الأربعاء",
    arabicMonthName: "سبتمبر",
    meetings: makeMeetings(
      new Date(2025, 8, 7),
      ["w3-wed-1", "w3-wed-2", "w3-wed-3", "w3-wed-4"],
      ["confirmed", "confirmed", "confirmed", "confirmed"],
    ),
  },
  {
    date: new Date(2025, 8, 8), // Thursday Sep 8
    arabicDayName: "الخميس",
    arabicMonthName: "سبتمبر",
    meetings: makeMeetings(
      new Date(2025, 8, 8),
      ["w3-thu-1", "w3-thu-2", "w3-thu-3", "w3-thu-4"],
      ["confirmed", "confirmed", "confirmed", "confirmed"],
    ),
  },
  {
    date: new Date(2025, 8, 9), // Friday Sep 9
    arabicDayName: "الجمعة",
    arabicMonthName: "سبتمبر",
    meetings: makeMeetings(
      new Date(2025, 8, 9),
      ["w3-fri-1", "w3-fri-2", "w3-fri-3", "w3-fri-4"],
      ["confirmed", "confirmed", "confirmed", "confirmed"],
    ),
  },
];

// Segments use the same teal palette as DonutChart
export const WEEKLY_BARS_DATA: DailyBarEntry[] = [
  {
    dayName: "الاثنين",
    segments: [
      { value: 2, color: "#0d3d3d" },
      { value: 1, color: "#2a9d8f" },
      { value: 1, color: "#76c7c0" },
      { value: 1, color: "#c8f0ed" },
    ],
  },
  {
    dayName: "الثلاثاء",
    segments: [
      { value: 3, color: "#0d3d3d" },
      { value: 2, color: "#1a6b6b" },
      { value: 1, color: "#76c7c0" },
    ],
  },
  {
    dayName: "الأربعاء",
    segments: [
      { value: 2, color: "#1a6b6b" },
      { value: 1, color: "#2a9d8f" },
      { value: 1, color: "#76c7c0" },
      { value: 1, color: "#c8f0ed" },
    ],
  },
  {
    dayName: "الخميس",
    segments: [
      { value: 4, color: "#0d3d3d" },
      { value: 2, color: "#1a6b6b" },
      { value: 1, color: "#2a9d8f" },
      { value: 1, color: "#76c7c0" },
    ],
  },
  {
    dayName: "الجمعة",
    segments: [
      { value: 1, color: "#2a9d8f" },
      { value: 1, color: "#76c7c0" },
      { value: 1, color: "#c8f0ed" },
    ],
  },
];
