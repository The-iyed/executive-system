import { getDaysInMonth } from "./calendar";

export interface WeekChunk {
  weekIndex: number;
  days: Date[];
}

/**
 * Split a month's days into week chunks, each ending on Saturday (getDay() === 6).
 * Returns up to 4 chunks (the 5th partial week, if any, is merged into the 4th).
 */
export function getWeeksInMonth(year: number, month: number): WeekChunk[] {
  const totalDays = getDaysInMonth(year, month);
  const weeks: WeekChunk[] = [];
  let currentWeekDays: Date[] = [];
  let weekIndex = 0;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    currentWeekDays.push(date);

    const isLastDay = d === totalDays;
    const isSaturday = date.getDay() === 6;

    if (isSaturday || isLastDay) {
      if (weekIndex < 3) {
        weeks.push({ weekIndex, days: [...currentWeekDays] });
        weekIndex++;
        currentWeekDays = [];
      } else {
        // Merge remaining days into week 4 (index 3)
        if (weeks[3]) {
          weeks[3].days.push(...currentWeekDays);
        } else {
          weeks.push({ weekIndex: 3, days: [...currentWeekDays] });
        }
        currentWeekDays = [];
      }
    }
  }

  return weeks;
}

/**
 * Returns the 0-based week index (0–3) for a given date within its month.
 */
export function getWeekIndexForDate(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const weeks = getWeeksInMonth(year, month);

  for (const week of weeks) {
    if (week.days.some((d) => d.getDate() === date.getDate())) {
      return week.weekIndex;
    }
  }
  return 0;
}
