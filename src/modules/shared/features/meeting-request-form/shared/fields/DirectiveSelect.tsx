import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/ui";
import { ChevronDown, Search, Loader2, X } from "lucide-react";
import { useDirectiveSearch, type DirectiveOption } from "../hooks/useDirectiveSearch";

interface DirectiveSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  defaultLabel?:string
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const isCompleted = status === "COMPLETED";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
        isCompleted
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      )}
    >
      {isCompleted ? "مكتمل" : "قيد التنفيذ"}
    </span>
  );
}

function OptionItem({ opt, isSelected, onSelect }: { opt: DirectiveOption; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-md px-3 py-2.5 text-right transition-colors hover:bg-accent",
        isSelected && "bg-accent",
      )}
      onClick={onSelect}
    >
        <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm leading-relaxed", isSelected && "font-medium")}>{opt.label}</p>
        </div>
        <StatusBadge status={opt.status} />
      </div>
    </button>
  );
}

export function DirectiveSelect({ value, onChange, placeholder, disabled, hasError, defaultLabel }: DirectiveSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useDirectiveSearch(debouncedSearch, open);

  const options = data?.options ?? [];
  const selectedLabel = options.find((o) => o.value === value)?.label || defaultLabel || value || "";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || isFetchingNextPage || !hasNextPage) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      fetchNextPage();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          hasError ? "border-destructive" : "border-input",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className={cn("truncate text-right", !value && "text-muted-foreground")}>
          {value ? selectedLabel : placeholder || "ابحث عن توجيه..."}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            />
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-input bg-background shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b border-input px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent py-2 px-2 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="ابحث بالعنوان أو رقم التوجيه..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div ref={scrollRef} onScroll={handleScroll} className="max-h-60 overflow-auto p-1">
            {options.map((opt) => (
              <OptionItem
                key={opt.value}
                opt={opt}
                isSelected={opt.value === value}
                onSelect={() => { onChange(opt.value); setOpen(false); }}
              />
            ))}
            {(isLoading || isFetchingNextPage) && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && options.length === 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
