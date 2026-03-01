export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getWeekEnd = (weekStart: Date): Date => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

export const getMeetingTimeDifferenceHours = (meetingStartDateIso: string | undefined): number | null => {
  if (!meetingStartDateIso || String(meetingStartDateIso).trim() === '') return null;
  const meeting = new Date(meetingStartDateIso);
  if (Number.isNaN(meeting.getTime())) return null;
  const now = new Date();
  return (meeting.getTime() - now.getTime()) / (1000 * 60 * 60);
};