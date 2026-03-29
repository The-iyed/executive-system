import React, { useCallback, useMemo } from 'react';
import { FormField } from './FormField';
import { FormDateTimePicker } from './FormDateTimePicker';

const ONE_HOUR_MS = 60 * 60 * 1000;

function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

function formatDurationMs(ms: number): string {
  if (ms < 0) return '';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0 && minutes > 0) return `${hours} ساعة و ${minutes} دقيقة`;
  if (hours > 0) return `${hours} ساعة`;
  if (minutes > 0) return `${minutes} دقيقة`;
  return 'أقل من دقيقة';
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export interface MeetingDateTimeRangePickerProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onStartBlur?: () => void;
  onEndBlur?: () => void;
  onStartFocus?: () => void;
  onEndFocus?: () => void;
  minStartDate: Date;
  required?: boolean;
  disabled?: boolean;
  startError?: string;
  endError?: string;
  startTouched?: boolean;
  endTouched?: boolean;
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
  onStartFocus,
  onEndFocus,
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
  const endMax = useMemo(
    () => (startDate ? endOfDay(startDate) : null),
    [startDate]
  );
  const isEndDisabled = !startDate || disabled;

  const handleStartChange = useCallback(
    (value: string) => {
      onStartChange(value);
      if (!value || endValue) return;
      const start = new Date(value);
      if (Number.isNaN(start.getTime())) return;
      const endDefault = new Date(start.getTime() + ONE_HOUR_MS);
      if (endDefault > endOfDay(start)) endDefault.setHours(23, 59, 0, 0);
      onEndChange(toLocalISOString(endDefault));
    },
    [onStartChange, onEndChange, endValue]
  );

  return (
    <div className="w-full min-w-0 sm:col-span-2 flex flex-col gap-2">
      {sectionTitle != null && (
        <span className="text-sm font-medium text-foreground">{sectionTitle}</span>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-[20px] ">
        <FormField
          className="w-full min-w-0"
          label={startLabel}
          required={required}
          error={startTouched ? startError : undefined}
        >
          <div onFocus={onStartFocus} className="w-full min-w-0">
            <FormDateTimePicker
            value={startValue || ''}
            onChange={handleStartChange}
            onBlur={onStartBlur}
            placeholder="اختر التاريخ والوقت"
            error={!!(startTouched && startError)}
            disabled={disabled}
            minDate={minStartDate}
          />
          </div>
        </FormField>
        <FormField
          className="w-full min-w-0"
          label={endLabel}
          required={required}
          error={endTouched ? endError : undefined}
        >
          <div onFocus={onEndFocus} className="w-full min-w-0">
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
          </div>
        </FormField>
      </div>
    </div>
  );
};