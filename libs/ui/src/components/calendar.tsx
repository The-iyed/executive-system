import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { cn } from "@/lib/utils"

export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      dir="rtl"
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 text-[#344054]" />,
        IconRight: () => <ChevronRight className="h-4 w-4 text-[#344054]" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }