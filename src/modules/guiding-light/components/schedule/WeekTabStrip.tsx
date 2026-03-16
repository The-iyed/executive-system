import { cn } from "@gl/lib/utils";

const WEEK_LABELS = [
  "الأسبوع الأول",
  "الأسبوع الثاني",
  "الأسبوع الثالث",
  "الأسبوع الرابع",
] as const;

interface WeekTabStripProps {
  activeWeek: number;
  totalWeeks: number;
  onWeekChange: (weekIndex: number) => void;
}

function WeekTabStrip({ activeWeek, totalWeeks, onWeekChange }: WeekTabStripProps) {
  const tabCount = Math.min(totalWeeks, 4);

  return (
    <div className="mb-6 flex gap-2 bg-[#F6F9FD] border border-[#EBEBEB] rounded-xl p-2">
      {Array.from({ length: tabCount }, (_, i) => (
        <button
          key={i}
          onClick={() => onWeekChange(i)}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
            activeWeek === i
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          {WEEK_LABELS[i]}
        </button>
      ))}
    </div>
  );
}

export { WeekTabStrip };
