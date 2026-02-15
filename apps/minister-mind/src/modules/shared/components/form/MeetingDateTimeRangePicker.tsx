import React, { useCallback, useMemo } from 'react';
import { FormField } from './FormField';
import { FormDateTimePicker } from './FormDateTimePicker';

const ONE_HOUR_MS = 60 * 60 * 1000;

function formatDurationMs(ms: number): string {
  if (ms < 0) return '';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0 && minutes > 0) return `${hours} ساعة و ${minutes} دقيقة`;
  if (hours > 0) return `${hours} ساعة`;
  if (minutes > 0) return `${minutes} دقيقة`;
  return 'أقل من دقيقة';
}

/** End of same calendar day (23:59:59.999) */
function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export interface MeetingDateTimeRangePickerProps {
  /** ISO datetime string */
  startValue: string;
  /** ISO datetime string */
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onStartBlur?: () => void;
  onEndBlur?: () => void;
  /** e.g. one week from now; dates before this are disabled for start */
  minStartDate: Date;
  /** Both start and end required (e.g. main slot) */
  required?: boolean;
  disabled?: boolean;
  startError?: string;
  endError?: string;
  startTouched?: boolean;
  endTouched?: boolean;
  /** Section title above the two pickers */
  sectionTitle?: string;
  startLabel?: string;
  endLabel?: string;
}

export const MeetingDateTimeRangePicker: React.FC<MeetingDateTimeRangePickerProps> = ({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  onStartBlur,
  onEndBlur,
  minStartDate,
  required = false,
  disabled = false,
  startError,
  endError,
  startTouched,
  endTouched,
  sectionTitle,
  startLabel = 'تاريخ ووقت البداية',
  endLabel = 'تاريخ ووقت النهاية',
}) => {
  const startDate = useMemo(
    () => (startValue && !Number.isNaN(new Date(startValue).getTime()) ? new Date(startValue) : null),
    [startValue]
  );
  /** End must be same day as start – max is end of that day (23:59:59). */
  const endMax = useMemo(
    () => (startDate ? endOfDay(startDate) : null),
    [startDate]
  );
  const isEndDisabled = !startDate || disabled;

  /** When user first selects start and end is empty, set end to start + 1 hour (same day). */
  const handleStartChange = useCallback(
    (value: string) => {
      onStartChange(value);
      if (!value || endValue) return;
      const start = new Date(value);
      if (Number.isNaN(start.getTime())) return;
      const endDefault = new Date(start.getTime() + ONE_HOUR_MS);
      if (endDefault > endOfDay(start)) endDefault.setHours(23, 59, 0, 0);
      onEndChange(endDefault.toISOString());
    },
    [onStartChange, onEndChange, endValue]
  );

  const durationMs =
    startDate && endValue
      ? (() => {
          const end = new Date(endValue);
          return Number.isNaN(end.getTime()) ? null : end.getTime() - startDate.getTime();
        })()
      : null;
  const durationLabel = durationMs != null && durationMs >= 0 ? formatDurationMs(durationMs) : null;

  return (
    <div className="w-full min-w-0 sm:col-span-2 flex flex-col gap-2">
      {sectionTitle != null && (
        <span className="text-sm font-medium text-foreground">{sectionTitle}</span>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          className="w-full min-w-0"
          label={startLabel}
          required={required}
          error={startTouched ? startError : undefined}
        >
          <FormDateTimePicker
            value={startValue || ''}
            onChange={handleStartChange}
            onBlur={onStartBlur}
            placeholder="اختر التاريخ والوقت"
            error={!!(startTouched && startError)}
            disabled={disabled}
            minDate={minStartDate}
          />
        </FormField>
        <FormField
          className="w-full min-w-0"
          label={endLabel}
          required={required}
          error={endTouched ? endError : undefined}
        >
          <FormDateTimePicker
            value={endValue || ''}
            onChange={onEndChange}
            onBlur={onEndBlur}
            placeholder="اختر الوقت (نفس اليوم)"
            error={!!(endTouched && endError)}
            disabled={isEndDisabled}
            minDate={startDate ?? undefined}
            maxDate={endMax ?? undefined}
            defaultDate={startDate ?? undefined}
            lockedDate={startDate ?? undefined}
          />
        </FormField>
      </div>
      {durationLabel != null && (
        <p className="text-sm text-muted-foreground text-right" aria-live="polite">
          المدة: {durationLabel} (نفس اليوم، الحد الأقصى 24 ساعة)
        </p>
      )}
    </div>
  );
};

MeetingDateTimeRangePicker.displayName = 'MeetingDateTimeRangePicker';
