import { ChevronLeft, ChevronRight } from "lucide-react";
import { ARABIC_MONTHS } from "@gl/lib/calendar";

interface MonthPickerProps {
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
}

function MonthPicker({ selectedDate, onMonthChange }: MonthPickerProps) {
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();

  function navigate(offset: number) {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month + offset);
    const daysInNewMonth = new Date(
      newDate.getFullYear(),
      newDate.getMonth() + 1,
      0,
    ).getDate();
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }
    onMonthChange(newDate);
  }

  return (
    <div className="mb-4 flex w-full items-center rounded-xl border border-border/40 bg-background px-4 py-2.5 md:w-auto md:min-w-[260px]">
      <button
        onClick={() => navigate(-1)}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:brightness-105 active:scale-95"
      >
        <ChevronRight className="size-4" />
      </button>

      <span className="flex-1 text-center text-[15px] font-bold text-foreground tracking-tight">
        {ARABIC_MONTHS[month]} {year}
      </span>

      <button
        onClick={() => navigate(1)}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:brightness-105 active:scale-95"
      >
        <ChevronLeft className="size-4" />
      </button>
    </div>
  );
}

export { MonthPicker };
