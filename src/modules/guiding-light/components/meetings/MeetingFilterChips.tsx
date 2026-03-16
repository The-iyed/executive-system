import { cn } from "@gl/lib/utils";

const FILTER_OPTIONS: { id: string; label: string }[] = [];

interface MeetingFilterChipsProps {
  activeFilters: string[];
  onToggle: (filterId: string) => void;
}

function MeetingFilterChips({ activeFilters, onToggle }: MeetingFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => onToggle(filter.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

export { MeetingFilterChips };
