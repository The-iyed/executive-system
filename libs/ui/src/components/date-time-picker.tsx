import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { ar } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/button"
import { Calendar } from "@/components/calendar"
import { Input } from "@/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/popover"

export interface DateTimePickerProps {
  value?: string // ISO string or datetime-local format
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "اختر التاريخ والوقت",
  className,
  required,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (value) {
      const date = new Date(value)
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${hours}:${minutes}`
    }
    return ""
  })

  React.useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date)
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      setTimeValue(`${hours}:${minutes}`)
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && timeValue) {
      const [hours, minutes] = timeValue.split(":")
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours, 10))
      newDate.setMinutes(parseInt(minutes, 10))
      onChange?.(newDate.toISOString())
    } else if (date) {
      onChange?.(date.toISOString())
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    if (selectedDate && newTime) {
      const [hours, minutes] = newTime.split(":")
      const newDate = new Date(selectedDate)
      newDate.setHours(parseInt(hours, 10))
      newDate.setMinutes(parseInt(minutes, 10))
      onChange?.(newDate.toISOString())
    }
  }

  // const displayValue = selectedDate
  //   ? `${format(selectedDate, "yyyy-MM-dd", { locale: ar })} ${timeValue || ""}`
  //   : ""

  return (
    <div className={cn("flex gap-2", className)} dir="rtl">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-right font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "yyyy-MM-dd", { locale: ar })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            dir="rtl"
          />
        </PopoverContent>
      </Popover>
      <div className="relative w-32">
        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          className="pr-10 text-right"
          placeholder="00:00"
          required={required}
          disabled={disabled}
        />
      </div>
    </div>
  )
}






