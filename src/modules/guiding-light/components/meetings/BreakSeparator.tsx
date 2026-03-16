import { Coffee } from "lucide-react";

interface BreakSeparatorProps {
  minutes: number;
}

function BreakSeparator({ minutes }: BreakSeparatorProps) {
  return (
    <div className="flex items-center gap-4 px-2">
      <div className="h-px flex-1 bg-amber-300/60" />
      <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 shadow-sm dark:bg-amber-950/40 dark:border-amber-700">
        <Coffee className="size-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm text-amber-700 dark:text-amber-300 whitespace-nowrap">
          وقت راحة <span className="font-bold text-amber-800 dark:text-amber-200">{minutes}</span> دقيقة
        </span>
      </div>
      <div className="h-px flex-1 bg-amber-300/60" />
    </div>
  );
}

export { BreakSeparator };
