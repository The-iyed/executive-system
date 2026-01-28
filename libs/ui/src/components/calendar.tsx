import { DayPicker, type DayPickerProps } from "react-day-picker"
import { arSA } from "react-day-picker/locale";
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
    <>
      <style>{`
      .rdp-root {
        --rdp-accent-color: #008774 !important;
        --rdp-background-color: #008774 !important;
      .rdp-dropdowns {
        .rdp-dropdown_root {
          border: none !important;
          outline: none !important;

          .rdp-caption_label {
            cursor: pointer !important;
            border: none !important;
            outline: none !important;
            font-size: 1rem !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0.5rem !important;
          }
        }   
       }
      }
      `}</style>
      <DayPicker
      animate
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      dir="rtl"
      locale={arSA}
      navLayout="around"
      captionLayout="dropdown"
      fixedWeeks={true}
      {...props}
      />
  </>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
