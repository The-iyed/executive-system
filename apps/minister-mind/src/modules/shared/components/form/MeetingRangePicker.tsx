import React, { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, ArrowLeft, X } from 'lucide-react';
import {
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  cn,
} from '@sanad-ai/ui';
import type { MeetingRangeValue, MeetingRangePickerProps } from './MeetingRangePicker.types';

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    if (minutes === 1) return 'دقيقة واحدة';
    if (minutes === 2) return 'دقيقتان';
    if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
    return `${minutes} دقيقة`;
  }
  if (minutes === 0) {
    if (hours === 1) return 'ساعة واحدة';
    if (hours === 2) return 'ساعتان';
    if (hours >= 3 && hours <= 10) return `${hours} ساعات`;
    return `${hours} ساعة`;
  }
  const hStr = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتان' : `${hours} ساعات`;
  const mStr = minutes === 1 ? 'دقيقة' : minutes === 2 ? 'دقيقتان' : `${minutes} دقائق`;
  return `${hStr} و ${mStr}`;
}

const timeSelectTriggerClass = cn(
  'h-10 w-full min-w-0 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2',
  'text-sm font-medium text-[#344054] shadow-[0px_1px_2px_rgba(16,24,40,0.05)]',
  'hover:border-[#98A2B3] focus:border-[#008774] focus:ring-2 focus:ring-[#008774]/20 focus:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-[placeholder]:text-[#667085]'
);

interface TimeSelectProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}

/** Clamp minute to valid 00–59 range */
function clampMinute(m: number): number {
  if (Number.isNaN(m)) return 0;
  return Math.max(0, Math.min(59, Math.round(m)));
}

function TimeSelect({ label, value, onChange, disabled }: TimeSelectProps) {
  const [h, m] = value.split(':').map(Number);
  const hour = Number.isNaN(h) ? 9 : Math.max(0, Math.min(23, h));
  const minute = clampMinute(Number.isNaN(m) ? 0 : m);

  const [minuteEditMode, setMinuteEditMode] = useState(false);
  const [minuteInputValue, setMinuteInputValue] = useState(String(minute).padStart(2, '0'));
  const minuteInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!minuteEditMode) {
      setMinuteInputValue(String(minute).padStart(2, '0'));
    }
  }, [minute, minuteEditMode]);

  React.useEffect(() => {
    if (minuteEditMode) {
      minuteInputRef.current?.focus();
      minuteInputRef.current?.select();
    }
  }, [minuteEditMode]);

  const handleHourChange = (v: string) => {
    const newH = Number(v);
    onChange(`${String(newH).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  const handleMinuteSelectChange = (v: string) => {
    const newM = clampMinute(Number(v));
    onChange(`${String(hour).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  const handleMinuteDoubleClick = () => {
    if (disabled) return;
    setMinuteInputValue(String(minute).padStart(2, '0'));
    setMinuteEditMode(true);
  };

  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setMinuteInputValue(raw.slice(0, 2));
  };

  const handleMinuteInputBlur = () => {
    const parsed = parseInt(minuteInputValue, 10);
    const validM =
      minuteInputValue === '' || Number.isNaN(parsed)
        ? minute
        : clampMinute(parsed);
    onChange(`${String(hour).padStart(2, '0')}:${String(validM).padStart(2, '0')}`);
    setMinuteInputValue(String(validM).padStart(2, '0'));
    setMinuteEditMode(false);
  };

  const handleMinuteInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex flex-col gap-1.5" dir="rtl">
      <span className="text-sm font-medium text-[#344054]">{label}</span>
      <div className="flex items-center gap-2">
        <Select value={String(hour)} onValueChange={handleHourChange} disabled={disabled}>
          <SelectTrigger className={cn(timeSelectTriggerClass, 'flex-1 basis-0')} aria-label="ساعة">
            <SelectValue placeholder="00" />
          </SelectTrigger>
          <SelectContent
            className="max-h-[220px] rounded-lg border-[#E4E7EC] bg-white shadow-lg"
            position="popper"
            sideOffset={4}
          >
            {HOURS_24.map((hr) => (
              <SelectItem
                key={hr}
                value={String(hr)}
                className="cursor-pointer rounded-md py-2 pr-8 pl-2 text-right focus:bg-[#F0FDF9] focus:text-[#008774] data-[highlighted]:bg-[#F0FDF9] data-[highlighted]:text-[#008774]"
              >
                {String(hr).padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[#667085] font-semibold tabular-nums" aria-hidden>
          :
        </span>
        {minuteEditMode ? (
          <input
            ref={minuteInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={minuteInputValue}
            onChange={handleMinuteInputChange}
            onBlur={handleMinuteInputBlur}
            onKeyDown={handleMinuteInputKeyDown}
            className={cn(
              timeSelectTriggerClass,
              'flex-1 basis-0 min-w-0 text-center',
              'focus:outline-none focus:ring-2 focus:ring-[#008774]/20 focus:border-[#008774]'
            )}
            aria-label="دقيقة (أدخل 00–59)"
          />
        ) : (
          <Select value={String(minute)} onValueChange={handleMinuteSelectChange} disabled={disabled}>
            <SelectTrigger
              className={cn(timeSelectTriggerClass, 'flex-1 basis-0')}
              aria-label="دقيقة"
              title="انقر مرتين للإدخال اليدوي (00–59)"
              onDoubleClick={handleMinuteDoubleClick}
            >
              <SelectValue placeholder="00" />
            </SelectTrigger>
            <SelectContent
              className="max-h-[220px] rounded-lg border-[#E4E7EC] bg-white shadow-lg"
              position="popper"
              sideOffset={4}
            >
              {MINUTES_60.map((minVal) => (
                <SelectItem
                  key={minVal}
                  value={String(minVal)}
                  className="cursor-pointer rounded-md py-2 pr-8 pl-2 text-right focus:bg-[#F0FDF9] focus:text-[#008774] data-[highlighted]:bg-[#F0FDF9] data-[highlighted]:text-[#008774]"
                >
                  {String(minVal).padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

const DEFAULT_VALUE: MeetingRangeValue = {
  date: null,
  startTime: '09:00',
  endTime: '10:00',
  isFullDay: false,
};

export function MeetingRangePicker({
  value,
  onChange,
  onBlur,
  minDate,
  isReport = false,
  disabled = false,
  error = false,
  placeholder = 'اختر التاريخ والوقت',
  className,
}: MeetingRangePickerProps) {
  const [open, setOpen] = useState(false);
  const current = value ?? DEFAULT_VALUE;

  const [innerDate, setInnerDate] = useState<Date | undefined>(current.date ?? undefined);
  const [innerStart, setInnerStart] = useState(current.startTime);
  const [innerEnd, setInnerEnd] = useState(current.endTime);

  const syncFromValue = useCallback(() => {
    if (value?.date) {
      setInnerDate(value.date);
      setInnerStart(value.startTime);
      setInnerEnd(value.endTime);
    } else {
      setInnerDate(undefined);
      setInnerStart('09:00');
      setInnerEnd('10:00');
    }
  }, [value?.date, value?.startTime, value?.endTime]);

  React.useEffect(() => {
    if (open) syncFromValue();
  }, [open, syncFromValue]);

  const commit = useCallback(
    (date: Date | null, startTime: string, endTime: string, isFullDay: boolean) => {
      onChange?.({
        date,
        startTime,
        endTime,
        isFullDay,
      });
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      commit(null, '09:00', '10:00', false);
      setInnerDate(undefined);
      setInnerStart('09:00');
      setInnerEnd('10:00');
    },
    [disabled, commit]
  );

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      setInnerDate(date);
      if (isReport && date) {
        commit(date, '00:00', '23:59', true);
        setOpen(false);
      }
    },
    [isReport, commit]
  );

  const handleStartTimeChange = useCallback(
    (newStart: string) => {
      setInnerStart(newStart);
      const endM = timeToMinutes(innerEnd);
      const startM = timeToMinutes(newStart);
      if (startM >= endM) {
        const newEndM = Math.min(startM + 60, 24 * 60 - 1);
        const h = Math.floor(newEndM / 60);
        const m = newEndM % 60;
        const newEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        setInnerEnd(newEnd);
      }
    },
    [innerEnd]
  );

  const handleConfirm = useCallback(() => {
    if (!innerDate) return;
    const startM = timeToMinutes(innerStart);
    const endM = timeToMinutes(innerEnd);
    if (endM <= startM) return;
    commit(innerDate, innerStart, innerEnd, false);
    onBlur?.();
    setOpen(false);
  }, [innerDate, innerStart, innerEnd, commit, onBlur]);

  const endBeforeOrEqualStart = innerDate && timeToMinutes(innerEnd) <= timeToMinutes(innerStart);

  const committedDurationMinutes =
    current.date && current.startTime && current.endTime && !current.isFullDay
      ? timeToMinutes(current.endTime) - timeToMinutes(current.startTime)
      : 0;
  const durationLabel =
    committedDurationMinutes > 0 ? formatDurationMinutes(committedDurationMinutes) : '';

  const displayText = useMemo(() => {
    if (current.isFullDay && current.date) {
      return `${format(current.date, 'd MMMM yyyy', { locale: ar })} — يوم كامل`;
    }
    if (current.date && current.startTime && current.endTime) {
      const d = format(current.date, 'd MMMM yyyy', { locale: ar });
      return `${d}، ${current.startTime} ← ${current.endTime}`;
    }
    return placeholder;
  }, [current.date, current.startTime, current.endTime, current.isFullDay, placeholder]);

  const calendarDisabled = minDate != null ? { before: minDate } : undefined;

  return (
    <div className={cn('w-full min-w-0', className)} dir="rtl">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onBlur={onBlur}
            className={cn(
              'w-full min-h-[48px] justify-start text-right font-normal gap-2 rounded-xl shadow-sm',
              'px-[14px] py-[10px] bg-white border border-[#D0D5DD]',
              'text-[16px] leading-[24px] shadow-[0px_1px_2px_rgba(16,24,40,0.05)]',
              !current.date && 'text-[#667085]',
              current.date && 'text-[#344054]',
              error && 'border-[#D13C3C]',
              !error && 'focus:border-[#008774] focus:ring-2 focus:ring-[#008774]/20 focus:outline-none'
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-[#667085]" />
            <span className="flex-1 truncate text-right" dir={current.date ? 'rtl' : undefined}>
              {displayText}
            </span>
            {current.date && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="shrink-0 rounded p-1 text-[#667085] hover:bg-[#F2F4F7] hover:text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#008774]/20"
                aria-label="مسح"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {current.date && !current.isFullDay && durationLabel ? (
              <span className="shrink-0 text-[#008774] text-sm font-medium">{durationLabel}</span>
            ) : null}
            <Clock className="h-4 w-4 shrink-0 text-[#667085]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-2xl border border-[#E4E7EC] shadow-xl"
          align="start"
          dir="rtl"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (
              target?.closest?.('[data-radix-select-content]') ??
              target?.closest?.('[data-radix-popper-content-wrapper]')
            ) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex flex-col p-2">
            <div className="border-b border-[#E4E7EC] px-2">
              <Calendar
                mode="single"
                selected={innerDate}
                onSelect={handleDateSelect}
                initialFocus
                dir="rtl"
                disabled={calendarDisabled}
              />
            </div>

            {!isReport && (
              <>
                <div className="px-2 pt-3 pb-2">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
                    <TimeSelect
                      label="وقت البداية"
                      value={innerStart}
                      onChange={handleStartTimeChange}
                      disabled={!innerDate}
                    />
                    <div className="hidden sm:flex shrink-0 pb-2 text-[#667085]" aria-hidden>
                      <ArrowLeft className="h-4 w-4" />
                    </div>
                    <TimeSelect
                      label="وقت النهاية"
                      value={innerEnd}
                      onChange={setInnerEnd}
                      disabled={!innerDate}
                    />
                  </div>
                  {endBeforeOrEqualStart && innerDate && (
                    <p className="mt-2 text-sm font-medium text-[#D13C3C]">
                      وقت النهاية يجب أن يكون بعد وقت البداية
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!innerDate || endBeforeOrEqualStart}
                  className="w-full rounded-xl bg-[#008774] text-white hover:bg-[#007a68] focus:ring-2 focus:ring-[#008774]/20 mt-2"
                >
                  تأكيد الموعد
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

MeetingRangePicker.displayName = 'MeetingRangePicker';
