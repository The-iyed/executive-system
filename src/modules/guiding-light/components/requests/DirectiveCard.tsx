import { cn } from "@gl/lib/utils";
import {
  type MinisterDirective,
  DIRECTIVE_STATUS_AR,
} from "@gl/api/minister-directives";
import { CircleDot, CheckCircle2, Clock, CalendarDays } from "lucide-react";

interface DirectiveCardProps {
  directive: MinisterDirective;
}

function DirectiveCard({ directive }: DirectiveCardProps) {
  const isOpen = directive.scheduling_officer_status === "OPEN";
  const statusLabel = DIRECTIVE_STATUS_AR[directive.status];

  const createdDate = directive.created_at
    ? new Date(directive.created_at).toLocaleDateString("ar-SA", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border bg-card px-5 py-5 transition-all duration-300 hover:shadow-md overflow-hidden",
        isOpen
          ? "border-border/40 hover:border-primary/30"
          : "border-border/20 hover:border-primary/20"
      )}
    >

      {/* Top row: status badge + icon */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-xl transition-colors duration-200",
            isOpen
              ? "bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30"
              : "bg-primary/8 group-hover:bg-primary/12"
          )}
        >
          {isOpen ? (
            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="size-4 text-primary" />
          )}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors duration-200",
            isOpen
              ? "bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30"
              : directive.status === "ADOPTED"
              ? "bg-primary/8 text-primary border border-primary/15"
              : "bg-muted text-muted-foreground border border-border/30"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              isOpen ? "bg-amber-500 animate-pulse" : "bg-primary"
            )}
          />
          {isOpen ? "قيد المتابعة" : statusLabel}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[13px] font-bold text-foreground line-clamp-2 leading-relaxed pr-1">
        {directive.title}
      </h3>

      {/* Date */}
      {createdDate && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
          <CalendarDays className="size-3" />
          {createdDate}
        </div>
      )}
    </div>
  );
}

export { DirectiveCard };
