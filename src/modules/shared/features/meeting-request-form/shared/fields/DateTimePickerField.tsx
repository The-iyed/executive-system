import { useState, useEffect, useMemo, useCallback } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@/lib/ui";

interface DateTimePickerFieldProps {
  value?: string;
  endValue?: string;
  onChange: (value: string) => void;
  onChangeEnd?: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  minDate?: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function TimeInput({ hour, minute, onHourChange, onMinuteChange, label }: {
  hour: string; minute: string; onHourChange: (h: string) => void; onMinuteChange: (m: string) => void; label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-medium text-muted-foreground leading-none">{label}</span>
      <div className="flex items-center gap-px" dir="ltr">
        <select value={hour} onChange={(e) => onHourChange(e.target.value)}
          className="appearance-none bg-background border border-border rounded-s px-1 py-0.5 text-xs font-medium text-center w-9 h-7 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-xs font-bold text-muted-foreground">:</span>
        <select value={minute} onChange={(e) => onMinuteChange(e.target.value)}
          className="appearance-none bg-background border border-border rounded-e px-1 py-0.5 text-xs font-medium text-center w-9 h-7 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
          {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

/**
 * Parse date/time from ISO string without timezone conversion.
 * "2026-04-07T09:00:00+03:00" → { year:2026, month:3, day:7, hour:"09", minute:"00" }
 */
function parseIsoLocal(iso: string): { date: Date; hour: string; minute: string } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, year, month, day, hour, minute] = m;
  // Create date using component parts to avoid timezone shift
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return { date, hour, minute };
}

export function DateTimePickerField({
  value, endValue, onChange, onChangeEnd,
  placeholder = "اختر التاريخ والوقت", hasError, disabled, minDate,
}: DateTimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");

  useEffect(() => {
    if (value) {
      const parsed = parseIsoLocal(value);
      if (parsed) {
        setSelectedDate(parsed.date);
        setStartHour(parsed.hour);
        setStartMinute(parsed.minute);
      }
    }
    if (endValue) {
      const parsed = parseIsoLocal(endValue);
      if (parsed) {
        setEndHour(parsed.hour);
        setEndMinute(parsed.minute);
      }
    }
  }, []);

  const toLocalISO = useCallback((date: Date, hour: string, minute: string) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}T${hour}:${minute}:00`;
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedDate) return;
    onChange(toLocalISO(selectedDate, startHour, startMinute));
    onChangeEnd?.(toLocalISO(selectedDate, endHour, endMinute));
    setOpen(false);
  }, [selectedDate, startHour, startMinute, endHour, endMinute, onChange, onChangeEnd, toLocalISO]);

  const durationMinutes = useMemo(() => {
    const s = parseInt(startHour) * 60 + parseInt(startMinute);
    const e = parseInt(endHour) * 60 + parseInt(endMinute);
    return e > s ? e - s : 0;
  }, [startHour, startMinute, endHour, endMinute]);

  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h} ساعة ${m} د` : `${h} ساعة`;
    }
    return `${mins} دقيقة`;
  };

  const displayValue = value
    ? (() => {
        const parsed = parseIsoLocal(value);
        if (!parsed) return value;
        const dateStr = format(parsed.date, "yyyy/MM/dd", { locale: ar });
        const timeStr = `${parsed.hour}:${parsed.minute}`;
        if (endValue) {
          const parsedEnd = parseIsoLocal(endValue);
          if (parsedEnd) return `${dateStr}  ${timeStr} → ${parsedEnd.hour}:${parsedEnd.minute}`;
        }
        return `${dateStr} - ${timeStr}`;
      })()
    : null;

  const disabledDays = minDate ? { before: minDate } : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-9 text-xs sm:text-sm",
            "border-input hover:bg-accent/50 transition-colors",
            !displayValue && "text-muted-foreground",
            hasError && "border-destructive ring-1 ring-destructive/20"
          )}>
          <div className="flex items-center gap-1.5 truncate">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayValue || placeholder}</span>
          </div>
          <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg border border-border rounded-xl overflow-hidden max-w-[calc(100vw-1rem)]"
        align="center"
        dir="rtl"
        sideOffset={6}
        side="bottom"
        avoidCollisions={true}
        collisionPadding={16}
        sticky="partial"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col max-h-[min(480px,calc(100vh-2rem))] overflow-y-auto overscroll-contain">
          <div className="p-2 pb-1">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate}
              locale={ar} disabled={disabledDays} className="p-0 pointer-events-auto" />
          </div>
          <div className="border-t border-border bg-muted/30 px-3 py-2 space-y-1.5 shrink-0">
            <div className="flex items-end justify-center gap-3">
              <TimeInput hour={startHour} minute={startMinute}
                onHourChange={setStartHour} onMinuteChange={setStartMinute} label="وقت البداية" />
              <span className="text-muted-foreground text-sm pb-0.5">←</span>
              <TimeInput hour={endHour} minute={endMinute}
                onHourChange={setEndHour} onMinuteChange={setEndMinute} label="وقت النهاية" />
            </div>
            {durationMinutes > 0 && (
              <p className="text-center text-[10px] text-muted-foreground">
                المدة: <span className="font-semibold text-foreground">{formatDuration(durationMinutes)}</span>
              </p>
            )}
            <Button type="button" onClick={handleConfirm}
              disabled={!selectedDate || durationMinutes === 0}
              className="w-full h-8 text-xs font-semibold rounded-lg">
              تأكيد الموعد
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
