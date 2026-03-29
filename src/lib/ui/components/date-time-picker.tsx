import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { ar } from "date-fns/locale"

import { cn } from "@/lib/ui/lib/utils"

import { Button } from "@/lib/ui/components/button"
import { Calendar } from "@/lib/ui/components/calendar"
function toLocalISOString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}:00`
}

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/components/select"

export interface DateTimePickerProps {
  value?: string // ISO string or datetime-local format
  onChange?: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  minDate?: Date
  maxDate?: Date
  defaultDate?: Date
  lockedDate?: Date
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function localDayStartMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function toTimeHHmm(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

const timeSelectTriggerClass = cn(
  "h-10 w-full min-w-0 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2",
  "text-sm font-medium text-[#344054] shadow-[0px_1px_2px_rgba(16,24,40,0.05)]",
  "hover:border-[#98A2B3] focus:border-[#008774] focus:ring-2 focus:ring-[#008774]/20 focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "data-[placeholder]:text-[#667085]"
)

function Time24Select({
  value,
  onChange,
  onBlur,
  disabled,
  className,
}: {
  value: string
  onChange: (time: string) => void
  onBlur?: () => void
  disabled?: boolean
  min?: string
  max?: string
  className?: string
}) {
  const [h, m] = value.split(":").map(Number)
  const hour = Number.isNaN(h) ? 0 : Math.max(0, Math.min(23, h))
  const minute = Number.isNaN(m) ? 0 : Math.max(0, Math.min(59, m))

  const handleHourChange = (v: string) => {
    const newH = Number(v)
    const newTime = `${String(newH).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    onChange(newTime)
  }
  const handleMinuteChange = (v: string) => {
    const newM = Number(v)
    const newTime = `${String(hour).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
    onChange(newTime)
  }

  return (
    <div className={cn("flex items-center gap-2", className)} dir="rtl">
      <Select
        value={String(hour)}
        onValueChange={handleHourChange}
        disabled={disabled}
      >
        <SelectTrigger
          onBlur={onBlur}
          className={cn(timeSelectTriggerClass, "flex-1 basis-0")}
          aria-label="ساعة"
        >
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
              {String(hr).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-[#667085] font-semibold tabular-nums" aria-hidden>
        :
      </span>
      <Select
        value={String(minute)}
        onValueChange={handleMinuteChange}
        disabled={disabled}
      >
        <SelectTrigger
          onBlur={onBlur}
          className={cn(timeSelectTriggerClass, "flex-1 basis-0")}
          aria-label="دقيقة"
        >
          <SelectValue placeholder="00" />
        </SelectTrigger>
        <SelectContent
          className="max-h-[220px] rounded-lg border-[#E4E7EC] bg-white shadow-lg"
          position="popper"
          sideOffset={4}
        >
          {MINUTES.map((minuteVal) => (
            <SelectItem
              key={minuteVal}
              value={String(minuteVal)}
              className="cursor-pointer rounded-md py-2 pr-8 pl-2 text-right focus:bg-[#F0FDF9] focus:text-[#008774] data-[highlighted]:bg-[#F0FDF9] data-[highlighted]:text-[#008774]"
            >
              {String(minuteVal).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function DateTimePicker({
  value,
  onChange,
  onBlur,
  placeholder = "اختر التاريخ والوقت",
  className,
  required: _required,
  disabled,
  error,
  minDate,
  maxDate,
  defaultDate,
  lockedDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const effectiveLockedDate = lockedDate && !Number.isNaN(lockedDate.getTime()) ? lockedDate : undefined

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => {
    if (effectiveLockedDate) return effectiveLockedDate
    if (value) {
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? undefined : d
    }
    if (defaultDate && !Number.isNaN(defaultDate.getTime())) return defaultDate
    return undefined
  })
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (value) {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) return toTimeHHmm(date)
    }
    if (defaultDate && !Number.isNaN(defaultDate.getTime())) return toTimeHHmm(defaultDate)
    if (effectiveLockedDate) return toTimeHHmm(effectiveLockedDate)
    return "09:00"
  })

  React.useEffect(() => {
    if (effectiveLockedDate) {
      setSelectedDate(effectiveLockedDate)
      if (value) {
        const date = new Date(value)
        if (!Number.isNaN(date.getTime())) setTimeValue(toTimeHHmm(date))
      } else if (defaultDate) {
        setTimeValue(toTimeHHmm(defaultDate))
      }
      return
    }
    if (value) {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        setSelectedDate(date)
        setTimeValue(toTimeHHmm(date))
      } else {
        setSelectedDate(undefined)
        setTimeValue(defaultDate ? toTimeHHmm(defaultDate) : "09:00")
      }
    } else {
      setSelectedDate(defaultDate && !Number.isNaN(defaultDate.getTime()) ? defaultDate : undefined)
      setTimeValue(defaultDate && !Number.isNaN(defaultDate.getTime()) ? toTimeHHmm(defaultDate) : "09:00")
    }
  }, [value, defaultDate, effectiveLockedDate])

  const commitDateTime = React.useCallback(
    (date: Date | undefined, time: string) => {
      if (!date || !time) return
      const [h, m] = time.split(":").map(Number)
      const d = new Date(date)
      d.setHours(h, m, 0, 0)
      if (minDate != null && d < minDate) {
        d.setTime(minDate.getTime())
      }
      if (maxDate != null && d > maxDate) return
      onChange?.(toLocalISOString(d))
    },
    [onChange, minDate, maxDate]
  )

  const handleDateSelect = (date: Date | undefined) => {
    if (date && minDate != null && !Number.isNaN(minDate.getTime())) {
      if (localDayStartMs(date) < localDayStartMs(minDate)) return
    }
    if (date && maxDate != null && !Number.isNaN(maxDate.getTime())) {
      if (localDayStartMs(date) > localDayStartMs(maxDate)) return
    }
    setSelectedDate(date)
    if (date && timeValue) {
      commitDateTime(date, timeValue)
    } else if (date) {
      commitDateTime(date, timeValue)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    const dateToUse = effectiveLockedDate ?? selectedDate
    if (dateToUse && newTime) {
      commitDateTime(dateToUse, newTime)
      setOpen(false)
    }
  }

  const handleTimeBlur = () => {
    onBlur?.()
  }

  const calendarDisabled = React.useMemo(() => {
    const matchers: Array<(date: Date) => boolean> = []
    if (minDate != null && !Number.isNaN(minDate.getTime())) {
      const minMs = localDayStartMs(minDate)
      matchers.push((date) => localDayStartMs(date) < minMs)
    }
    if (maxDate != null && !Number.isNaN(maxDate.getTime())) {
      const maxMs = localDayStartMs(maxDate)
      matchers.push((date) => localDayStartMs(date) > maxMs)
    }
    if (matchers.length === 0) return undefined
    return matchers.length === 1 ? matchers[0]! : matchers
  }, [minDate, maxDate])

  const timeMin =
    minDate != null && selectedDate != null && isSameDay(selectedDate, minDate) ? toTimeHHmm(minDate) : undefined
  const timeMax =
    maxDate != null && selectedDate != null && isSameDay(selectedDate, maxDate) ? toTimeHHmm(maxDate) : undefined

  const displayDate = effectiveLockedDate ?? selectedDate
  const showFormattedValue = effectiveLockedDate
    ? !!(value && timeValue)
    : !!(displayDate && timeValue)
  const displayText = showFormattedValue && displayDate && timeValue
    ? `${format(displayDate, "yyyy-MM-dd", { locale: ar })}، ${timeValue}`
    : placeholder

  const showCalendar = !effectiveLockedDate

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onBlur={onBlur}
          className={cn(
            "w-full max-w-full h-[44px] justify-start text-right font-normal gap-2",
            "px-[14px] py-[10px] bg-white border border-[#D0D5DD] rounded-lg",
            "text-[16px] leading-[24px] shadow-[0px_1px_2px_rgba(16,24,40,0.05)]",
            !showFormattedValue && "text-muted-foreground text-[#667085]",
            showFormattedValue && "text-[#344054]",
            error && "border-[#D13C3C]",
            !error && "focus:border-[#008774] focus:outline-none",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-[#667085]" />
          <span dir={showFormattedValue ? "ltr" : undefined}>{displayText}</span>
          <Clock className="h-4 w-4 shrink-0 text-[#667085] mr-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-[20px] border border-[#E4E7EC]"
        align="start"
        dir="rtl"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement
          if (target?.closest?.('[data-radix-select-content]') ?? target?.closest?.('[data-radix-popper-content-wrapper]')) {
            e.preventDefault()
          }
        }}
      >
        <div className="flex flex-col">
          {showCalendar && (
            <div className="border-b border-[#E4E7EC] px-2 pt-2">
              <p className="text-xs font-medium text-[#667085] mb-2 px-1">اختر التاريخ</p>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                dir="rtl"
                disabled={calendarDisabled}
              />
            </div>
          )}
          <div className="p-3">
            <p className="text-xs font-medium text-[#667085] mb-2">اختر الوقت (٢٤ ساعة)</p>
            <div
              className="cursor-pointer select-none"
              onClick={() => {
                if (displayDate) {
                  const timeInput = document.querySelector<HTMLSelectElement>('[aria-label="ساعة"]')
                  timeInput?.focus()
                }
              }}
            >
              <Time24Select
                value={timeValue}
                onChange={handleTimeChange}
                onBlur={handleTimeBlur}
                disabled={!displayDate}
                min={timeMin}
                max={timeMax}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
