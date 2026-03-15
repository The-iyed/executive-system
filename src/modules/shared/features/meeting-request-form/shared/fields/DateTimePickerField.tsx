import { useState, useEffect, useMemo } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

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

  const toLocalISO = (date: Date, hour: string, minute: string) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}T${hour}:${minute}:00`;
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    onChange(toLocalISO(selectedDate, startHour, startMinute));
    if (onChangeEnd) {
      onChangeEnd(toLocalISO(selectedDate, endHour, endMinute));
    }
    setOpen(false);
  };

  const durationMinutes = useMemo(() => {
    const s = parseInt(startHour) * 60 + parseInt(startMinute);
    const e = parseInt(endHour) * 60 + parseInt(endMinute);
    return e > s ? e - s : 0;
  }, [startHour, startMinute, endHour, endMinute]);

  const displayValue = value
    ? (() => {
        try {
          const d = new Date(value);
          const startStr = `${format(d, "yyyy/MM/dd", { locale: ar })} - ${format(d, "HH:mm")}`;
          if (endValue) {
            const ed = new Date(endValue);
            return `${startStr} → ${format(ed, "HH:mm")}`;
          }
          return startStr;
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
            "w-full justify-between font-normal h-10",
            "border-input",
            !displayValue && "text-muted-foreground",
            hasError && "border-destructive"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayValue || placeholder}</span>
          </div>
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" dir="rtl" sideOffset={8}>
        <div className="flex flex-col items-center">
          <div className="p-4 pb-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ar}
              disabled={disabledDays}
              className="p-0 pointer-events-auto"
            />
          </div>
          <div className="w-full border-t border-border" />
          <div className="w-full px-5 py-4 space-y-4">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">وقت البداية</span>
                <div className="flex items-center gap-1" dir="ltr">
                  <Select value={startHour} onValueChange={setStartHour}>
                    <SelectTrigger className="w-[52px] h-9 text-center text-sm font-medium border-input px-2 justify-center [&>svg]:hidden">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 min-w-[60px]">
                      {hours.map((h) => <SelectItem key={h} value={h} className="text-center">{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-base font-bold text-muted-foreground">:</span>
                  <Select value={startMinute} onValueChange={setStartMinute}>
                    <SelectTrigger className="w-[52px] h-9 text-center text-sm font-medium border-input px-2 justify-center [&>svg]:hidden">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 min-w-[60px]">
                      {minutes.map((m) => <SelectItem key={m} value={m} className="text-center">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-transparent">—</span>
                <span className="text-muted-foreground text-lg">←</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">وقت النهاية</span>
                <div className="flex items-center gap-1" dir="ltr">
                  <Select value={endHour} onValueChange={setEndHour}>
                    <SelectTrigger className="w-[52px] h-9 text-center text-sm font-medium border-input px-2 justify-center [&>svg]:hidden">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 min-w-[60px]">
                      {hours.map((h) => <SelectItem key={h} value={h} className="text-center">{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-base font-bold text-muted-foreground">:</span>
                  <Select value={endMinute} onValueChange={setEndMinute}>
                    <SelectTrigger className="w-[52px] h-9 text-center text-sm font-medium border-input px-2 justify-center [&>svg]:hidden">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 min-w-[60px]">
                      {minutes.map((m) => <SelectItem key={m} value={m} className="text-center">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {durationMinutes > 0 && (
              <div className="flex justify-center">
                <span className="text-[11px] text-muted-foreground px-3 py-1 rounded-full">
                  المدة: <span className="font-bold text-foreground">{durationMinutes}</span> دقيقة
                </span>
              </div>
            )}
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDate || durationMinutes === 0}
              className="w-full h-10 text-sm font-semibold rounded-lg"
            >
              تأكيد الموعد
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
