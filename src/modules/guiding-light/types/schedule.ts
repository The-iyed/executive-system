export type MeetingStatus =
  | "confirmed"
  | "apologized"
  | "postponed"
  | "unconfirmed";

export interface Meeting {
  id: string;
  title: string;
  location: string;
  time: Date;
  formattedTime: string;
  status: MeetingStatus;
}

export interface DayInfo {
  date: Date;
  dayNumber: number;
  arabicDayName: string;
  isToday: boolean;
  isSelected: boolean;
}

export interface MonthInfo {
  date: Date;
  monthIndex: number;
  arabicName: string;
  year: number;
  isCurrent: boolean;
  isSelected: boolean;
}
