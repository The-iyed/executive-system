import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/ui";
import { ChevronDown, Search, Loader2, X } from "lucide-react";
import { useManagerSearch, type ManagerOption } from "../hooks/useManagerSearch";
import type { UserSearchResult } from "../../api";

interface ManagerSelectProps {
  value: UserSearchResult | null | undefined;
  onChange: (user: UserSearchResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  initialLabel?: string;
}

export function ManagerSelect({
  value,
  onChange,
  placeholder,
  disabled,
  hasError,
  initialLabel,
}: ManagerSelectProps) {
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
    useManagerSearch(debouncedSearch, open);

  const options = data?.options ?? [];
  const selectedId = value?.objectGUID || value?.mail || "";
  const selectedLabel = options.find((o) => o.value === selectedId)?.label || initialLabel || "";

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
        <span className={cn(!value && "text-muted-foreground")}>
          {value ? selectedLabel : placeholder || "ابحث بالبريد الإلكتروني..."}
        </span>
        <div className="flex items-center gap-1">
          {selectedId && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
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
              placeholder="ابحث بالبريد الإلكتروني..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div ref={scrollRef} onScroll={handleScroll} className="max-h-48 overflow-auto p-1">
            {options.map((opt: ManagerOption) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  "w-full rounded-md px-3 py-2 text-right text-sm transition-colors hover:bg-accent",
                  opt.value === selectedId && "bg-accent font-medium",
                )}
                onClick={() => {
                  onChange(opt.user);
                  setOpen(false);
                }}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.subtitle}</div>
              </button>
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