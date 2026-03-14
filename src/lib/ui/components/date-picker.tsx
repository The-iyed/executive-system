import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/ui/lib/utils"
import { formatDateToISO } from "@/lib/ui/lib/dateUtils"
import { Button } from "@/lib/ui/components/button"
import { Calendar } from "@/lib/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/ui/components/popover"

export interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  error?: boolean
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  /** First selectable date; dates before this are disabled. */
  fromDate?: Date
  /** Last selectable date; dates after this are disabled. */
  toDate?: Date
  disabled?: boolean
}

const formatDate = (date: Date | undefined): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

function localDayStartMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "dd/mm/yyyy",
  className,
  error,
  value,
  onChange,
  onBlur,
  fromDate,
  toDate,
  disabled,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date || (value ? new Date(value) : undefined)
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (date !== undefined) {
      setSelectedDate(date);
    } else if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      } else {
        setSelectedDate(undefined);
      }
    } else {
      setSelectedDate(undefined);
    }
  }, [date, value]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate && fromDate != null && !Number.isNaN(fromDate.getTime())) {
      if (localDayStartMs(newDate) < localDayStartMs(fromDate)) return;
    }
    if (newDate && toDate != null && !Number.isNaN(toDate.getTime())) {
      if (localDayStartMs(newDate) > localDayStartMs(toDate)) return;
    }
    setSelectedDate(newDate);
    onDateChange?.(newDate);
    if (onChange) {
      if (newDate) {
        // Format as YYYY-MM-DD for HTML5 date input compatibility
        onChange(formatDateToISO(newDate));
      } else {
        onChange('');
      }
    }
    // Close the popover when a date is selected
    setOpen(false);
  };

  const calendarDisabled = React.useMemo(() => {
    const matchers: Array<(date: Date) => boolean> = [];
    if (fromDate != null && !Number.isNaN(fromDate.getTime())) {
      const minMs = localDayStartMs(fromDate);
      matchers.push((date) => localDayStartMs(date) < minMs);
    }
    if (toDate != null && !Number.isNaN(toDate.getTime())) {
      const maxMs = localDayStartMs(toDate);
      matchers.push((date) => localDayStartMs(date) > maxMs);
    }
    if (matchers.length === 0) return undefined;
    return matchers.length === 1 ? matchers[0]! : matchers;
  }, [fromDate, toDate]);

  const displayValue = selectedDate ? formatDate(selectedDate) : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full max-w-full h-[44px] px-[14px] py-[10px]",
            "flex items-center justify-start gap-2 bg-white", 
            "border border-[#D0D5DD] rounded-lg text-[#667085]", 
            "font-normal text-[16px] leading-[24px]",
            "focus:outline-none focus:border-[#008774]",
            !selectedDate && "text-muted-foreground",
            "box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05)",
            selectedDate && "text-[#344054]",
            error && "border-[#D13C3C]",
            !error && "focus:border-[#008774]",
            className
          )}
          onBlur={onBlur}
        >
          <CalendarIcon className="text-[#667085] mt-[1px] w-4 h-4" />
          <span className="text-[#667085]">
            {displayValue || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-[20px]" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          disabled={calendarDisabled}
        />
      </PopoverContent>
    </Popover>
  )
}
