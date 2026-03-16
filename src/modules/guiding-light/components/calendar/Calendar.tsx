import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@gl/lib/utils";

type CalendarProps = React.ComponentProps<"div"> & {
  defaultMonth?: number;
  defaultYear?: number;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();

  const rows: (number | null)[][] = [];
  let day = 1;

  for (let row = 0; day <= totalDays; row++) {
    rows[row] = [];
    for (let col = 0; col < 7; col++) {
      if (row === 0 && col < offset) {
        rows[row].push(null);
      } else if (day > totalDays) {
        rows[row].push(null);
      } else {
        rows[row].push(day++);
      }
    }
  }

  return rows;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function Calendar({
  className,
  defaultMonth,
  defaultYear,
  selectedDate: controlledSelected,
  onDateSelect,
  ...props
}: CalendarProps) {
  const now = new Date();
  const [month, setMonth] = useState(defaultMonth ?? now.getMonth());
  const [year, setYear] = useState(defaultYear ?? now.getFullYear());
  const [internalSelected, setInternalSelected] = useState<Date | undefined>(
    controlledSelected,
  );

  const selected = controlledSelected ?? internalSelected;

  const monthName = new Date(year, month).toLocaleString("en-US", {
    month: "long",
  });
  const rows = getCalendarGrid(year, month);

  function handlePrev() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function handleNext() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function handleDayClick(day: number) {
    const date = new Date(year, month, day);
    setInternalSelected(date);
    onDateSelect?.(date);
  }

  function isToday(day: number) {
    return isSameDay(new Date(year, month, day), now);
  }

  function isSelected(day: number) {
    return selected ? isSameDay(new Date(year, month, day), selected) : false;
  }

  return (
    <div
      dir="ltr"
      className={cn(
        "rounded-xl border bg-card p-5 text-card-foreground shadow-lg",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {monthName} {year}
        </h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="flex size-7 items-center justify-center rounded-full bg-[#2D6A6A] text-white transition-colors hover:bg-[#245858]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex size-7 items-center justify-center rounded-full bg-[#2D6A6A] text-white transition-colors hover:bg-[#245858]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="mt-4 grid grid-cols-7">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-1.5 text-center text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7">
        {rows.map((row, rowIndex) =>
          row.map((day, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="flex items-center justify-center py-1.5"
            >
              {day !== null && (
                <button
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    isSelected(day)
                      ? "bg-[#2D6A6A] text-white"
                      : isToday(day)
                        ? "bg-[#5AAFA5] text-white"
                        : "text-foreground hover:bg-muted",
                  )}
                >
                  {day}
                </button>
              )}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

export { Calendar };
export type { CalendarProps };
