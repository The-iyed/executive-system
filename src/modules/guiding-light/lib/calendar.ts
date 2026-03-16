import type { DayInfo, MonthInfo } from "@gl/types/schedule";

export const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const ARABIC_DAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function generateMonthDays(
  year: number,
  month: number,
  selectedDate: Date
): DayInfo[] {
  const today = new Date();
  const daysCount = getDaysInMonth(year, month);

  return Array.from({ length: daysCount }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return {
      date,
      dayNumber: i + 1,
      arabicDayName: ARABIC_DAY_NAMES[date.getDay()],
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate),
    };
  });
}

export function generateMonths(selectedDate: Date): MonthInfo[] {
  const today = new Date();
  const selectedYear = selectedDate.getFullYear();

  return Array.from({ length: 12 }, (_, i) => ({
    date: new Date(selectedYear, i, 1),
    monthIndex: i,
    arabicName: ARABIC_MONTHS[i],
    year: selectedYear,
    isCurrent:
      i === today.getMonth() && selectedYear === today.getFullYear(),
    isSelected:
      i === selectedDate.getMonth() &&
      selectedYear === selectedDate.getFullYear(),
  }));
}

export function formatTimeArabic(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "بعد الظهر" : "صباحاً";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `في تمام الساعة ${displayHours}.${minutes} ${period}`;
}
