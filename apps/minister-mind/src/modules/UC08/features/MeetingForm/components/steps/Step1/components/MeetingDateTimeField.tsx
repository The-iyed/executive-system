import { MeetingDateTimeRangePicker } from '@shared';

export interface MeetingDateTimeFieldProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onStartBlur: () => void;
  onEndBlur: () => void;
  minStartDate: Date;
  startError?: string;
  endError?: string;
  startTouched?: boolean;
  endTouched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingDateTimeField({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  onStartBlur,
  onEndBlur,
  minStartDate,
  startError,
  endError,
  startTouched,
  endTouched,
  disabled = false,
  required = true,
  className,
}: MeetingDateTimeFieldProps) {
  return (
    <div className={className}>
      <MeetingDateTimeRangePicker
        sectionTitle="موعد الاجتماع"
        startValue={startValue}
        endValue={endValue}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        onStartBlur={onStartBlur}
        onEndBlur={onEndBlur}
        minStartDate={minStartDate}
        required={required}
        disabled={disabled}
        startError={startTouched ? startError : undefined}
        endError={endTouched ? endError : undefined}
        startTouched={startTouched}
        endTouched={endTouched}
      />
    </div>
  );
}
