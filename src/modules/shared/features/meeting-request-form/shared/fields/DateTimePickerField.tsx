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

function TimeScrollPicker({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  label,
}: {
  hour: string;
  minute: string;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5" dir="ltr">
        <select
          value={hour}
          onChange={(e) => onHourChange(e.target.value)}
          className="appearance-none bg-background border border-border rounded px-1.5 py-1 text-sm font-medium text-center w-[42px] focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-sm font-bold text-muted-foreground px-0.5">:</span>
        <select
          value={minute}
          onChange={(e) => onMinuteChange(e.target.value)}
          className="appearance-none bg-background border border-border rounded px-1.5 py-1 text-sm font-medium text-center w-[42px] focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function DateTimePickerField({
  value,
  endValue,
  onChange,
  onChangeEnd,
  placeholder = "اختر التاريخ والوقت",
  hasError,
  disabled,
  minDate,
}: DateTimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");

  useEffect(() => {
    if (value) {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          setSelectedDate(d);
          setStartHour(String(d.getHours()).padStart(2, "0"));
          setStartMinute(String(d.getMinutes()).padStart(2, "0"));
        }
      } catch {}
    }
    if (endValue) {
      try {
        const d = new Date(endValue);
        if (!isNaN(d.getTime())) {
          setEndHour(String(d.getHours()).padStart(2, "0"));
          setEndMinute(String(d.getMinutes()).padStart(2, "0"));
        }
      } catch {}
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
    if (onChangeEnd) {
      onChangeEnd(toLocalISO(selectedDate, endHour, endMinute));
    }
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
      return m > 0 ? `${h} ساعة ${m} دقيقة` : `${h} ساعة`;
    }
    return `${mins} دقيقة`;
  };

  const displayValue = value
    ? (() => {
        try {
          const d = new Date(value);
          const dateStr = format(d, "yyyy/MM/dd", { locale: ar });
          const timeStr = format(d, "HH:mm");
          if (endValue) {
            const ed = new Date(endValue);
            return `${dateStr}  ${timeStr} → ${format(ed, "HH:mm")}`;
          }
          return `${dateStr} - ${timeStr}`;
        } catch {
          return value;
        }
      })()
    : null;

  const disabledDays = minDate ? { before: minDate } : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10 text-sm",
            "border-input hover:bg-accent/50 transition-colors",
            !displayValue && "text-muted-foreground",
            hasError && "border-destructive ring-1 ring-destructive/20"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayValue || placeholder}</span>
          </div>
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg border border-border rounded-xl overflow-hidden"
        align="start"
        dir="rtl"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Calendar */}
          <div className="p-3 pb-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ar}
              disabled={disabledDays}
              className="p-0 pointer-events-auto"
            />
          </div>

          {/* Time Section */}
          <div className="border-t border-border bg-muted/30">
            <div className="px-4 py-3 space-y-3">
              {/* Time Pickers Row */}
              <div className="flex items-end justify-center gap-4">
                <TimeScrollPicker
                  hour={startHour}
                  minute={startMinute}
                  onHourChange={setStartHour}
                  onMinuteChange={setStartMinute}
                  label="وقت البداية"
                />
                <span className="text-muted-foreground text-base pb-1.5">←</span>
                <TimeScrollPicker
                  hour={endHour}
                  minute={endMinute}
                  onHourChange={setEndHour}
                  onMinuteChange={setEndMinute}
                  label="وقت النهاية"
                />
              </div>

              {/* Duration Badge */}
              {durationMinutes > 0 && (
                <div className="flex justify-center">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    المدة: <span className="font-semibold text-foreground">{formatDuration(durationMinutes)}</span>
                  </span>
                </div>
              )}

              {/* Confirm Button */}
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedDate || durationMinutes === 0}
                className="w-full h-9 text-sm font-semibold rounded-lg"
              >
                تأكيد الموعد
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
