import { DayPicker, type DayPickerProps } from "react-day-picker"
import { arSA } from "react-day-picker/locale";
import "react-day-picker/dist/style.css"
import { cn } from "@/lib/ui/lib/utils"

export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
      .rdp-root {
        --rdp-accent-color: hsl(168, 100%, 26%) !important;
        --rdp-background-color: hsl(168, 100%, 26%) !important;
        --rdp-day_button-height: 32px !important;
        --rdp-day_button-width: 32px !important;
      }
      .rdp-root .rdp-month_caption {
        padding: 0 0.25rem !important;
      }
      .rdp-root .rdp-dropdowns {
        gap: 0.2rem;
      }
      .rdp-root .rdp-dropdowns .rdp-dropdown_root {
        border: none !important;
        outline: none !important;
      }
      .rdp-root .rdp-dropdowns .rdp-caption_label {
        cursor: pointer !important;
        border: none !important;
        outline: none !important;
        font-size: 0.85rem !important;
        font-weight: 600 !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 0.2rem !important;
      }
      .rdp-root .rdp-nav button {
        width: 26px !important;
        height: 26px !important;
        border-radius: 6px !important;
        color: hsl(168, 100%, 26%) !important;
        transition: background-color 0.15s ease;
      }
      .rdp-root .rdp-nav button:hover {
        background-color: hsl(168, 100%, 26%, 0.08) !important;
      }
      .rdp-root .rdp-nav button svg {
        width: 14px !important;
        height: 14px !important;
        stroke-width: 2.5 !important;
      }
      .rdp-root .rdp-weekday {
        font-size: 0.65rem !important;
        font-weight: 600 !important;
        color: hsl(var(--muted-foreground)) !important;
        padding: 0 !important;
        height: 24px !important;
      }
      .rdp-root .rdp-day {
        padding: 1px !important;
      }
      .rdp-root .rdp-day_button {
        font-size: 0.75rem !important;
        font-weight: 500 !important;
        border-radius: 50% !important;
        transition: all 0.15s ease !important;
      }
      .rdp-root .rdp-day_button:hover {
        background-color: hsl(168, 100%, 26%, 0.08) !important;
      }
      .rdp-root .rdp-selected .rdp-day_button {
        background-color: hsl(168, 100%, 26%) !important;
        color: white !important;
        font-weight: 700 !important;
        box-shadow: 0 2px 8px hsl(168 100% 26% / 0.3) !important;
      }
      .rdp-root .rdp-today:not(.rdp-selected) .rdp-day_button {
        color: hsl(168, 100%, 26%) !important;
        font-weight: 700 !important;
        border: 1.5px solid hsl(168, 100%, 26%) !important;
      }
      .rdp-root .rdp-outside .rdp-day_button {
        opacity: 0.3 !important;
      }
      .rdp-root .rdp-disabled .rdp-day_button {
        opacity: 0.25 !important;
        cursor: not-allowed !important;
      }
      @media (max-width: 400px) {
        .rdp-root {
          --rdp-day_button-height: 28px !important;
          --rdp-day_button-width: 28px !important;
        }
        .rdp-root .rdp-day_button {
          font-size: 0.7rem !important;
        }
        .rdp-root .rdp-weekday {
          font-size: 0.6rem !important;
        }
      }
      `}</style>
      <DayPicker
      animate
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
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
