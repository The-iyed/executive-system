/**
 * Value shape for MeetingRangePicker.
 * Same-day date with start/end time; isFullDay when 00:00–23:59 (e.g. report mode).
 */
export interface MeetingRangeValue {
  date: Date | null;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  isFullDay: boolean;
}

export interface MeetingRangePickerProps {
  value?: MeetingRangeValue;
  onChange?: (value: MeetingRangeValue) => void;
  onBlur?: () => void;
  minDate?: Date;
  /** Special mode: full-day only, no time picker; auto 00:00–23:59, close on date pick, "يوم كامل" badge. */
  isReport?: boolean;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  className?: string;
}
