import { useRef, useEffect } from "react";
import { generateMonthDays } from "@gl/lib/calendar";

interface DayCalendarStripProps {
  selectedDate: Date;
  onDaySelect: (date: Date) => void;
}

function DayCalendarStrip({ selectedDate, onDaySelect }: DayCalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedDayRef = useRef<HTMLButtonElement>(null);

  const days = generateMonthDays(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate
  );

  useEffect(() => {
    selectedDayRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedDate]);

  return (
    <div className="relative mb-6 isolate">
      <div
        ref={scrollRef}
        className="scrollbar-hide flex overflow-x-auto px-10 relative z-[3] rounded-2xl bg-background border border-border/40 py-4"
        style={{
          gap: 12,
          maskImage:
            "linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)",
        }}
      >
        <div className="flex shrink-0 items-center gap-2.5">
          {days.map((day) => {
            const selected = day.isSelected;
            return (
              <button
                key={day.date.toISOString()}
                ref={selected ? selectedDayRef : undefined}
                type="button"
                onClick={() => onDaySelect(day.date)}
                className={`flex shrink-0 flex-col items-center justify-center rounded-full transition-all duration-200 min-w-[56px] h-[76px] gap-2 ${
                  selected
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/40 text-foreground hover:bg-muted"
                }`}
              >
                <span className={`text-[15px] font-bold leading-none tracking-tight ${
                  selected ? "text-primary-foreground" : "text-foreground"
                }`}>
                  {day.dayNumber}
                </span>
                <span className={`text-[10px] leading-none ${
                  selected ? "text-primary-foreground/80" : "text-muted-foreground/60"
                }`}>
                  {day.arabicDayName}
                </span>
                {selected && (
                  <span className="size-1.5 rounded-full bg-primary-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { DayCalendarStrip };
