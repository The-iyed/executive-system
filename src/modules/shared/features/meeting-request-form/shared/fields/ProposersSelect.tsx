import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/ui";
import { ChevronDown, Search, Loader2, X, Check, Users } from "lucide-react";
import { useManagerSearch, type ManagerOption } from "../hooks/useManagerSearch";
import type { UserSearchResult } from "../../api";

export interface ProposerSelection extends UserSearchResult {
  /** Display label for the chip */
  _label: string;
}

interface ProposersSelectProps {
  value: ProposerSelection[];
  onChange: (users: ProposerSelection[]) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}

export function ProposersSelect({
  value = [],
  onChange,
  placeholder = "ابحث عن المقترحين...",
  disabled,
  hasError,
}: ProposersSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useManagerSearch(debouncedSearch, open);

  const options = data?.options ?? [];
  const selectedIds = new Set(value.map((v) => v.objectGUID));

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

  const toggleUser = useCallback(
    (opt: ManagerOption) => {
      const isSelected = selectedIds.has(opt.value);
      if (isSelected) {
        onChange(value.filter((v) => v.objectGUID !== opt.value));
      } else {
        const newUser: ProposerSelection = {
          ...opt.user,
          _label: opt.label,
        };
        onChange([...value, newUser]);
      }
    },
    [value, onChange, selectedIds]
  );

  const removeUser = useCallback(
    (guid: string) => {
      onChange(value.filter((v) => v.objectGUID !== guid));
    },
    [value, onChange]
  );

  const chipsRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(value.length);

  // Measure how many chips fit in the available width
  useEffect(() => {
    if (value.length === 0) { setVisibleCount(0); return; }
    const container = measureRef.current;
    if (!container) { setVisibleCount(value.length); return; }

    const doMeasure = () => {
      const chips = Array.from(container.querySelectorAll('[data-measure-chip]')) as HTMLElement[];
      if (chips.length === 0) { setVisibleCount(value.length); return; }
      
      const containerWidth = container.offsetWidth;
      // Reserve ~80px for "+N" badge + clear/chevron actions
      const reserved = 80;
      let usedWidth = 0;
      let count = 0;
      
      for (const chip of chips) {
        const chipWidth = chip.offsetWidth + 6; // 6px for gap
        if (usedWidth + chipWidth <= containerWidth - reserved) {
          usedWidth += chipWidth;
          count++;
        } else break;
      }
      setVisibleCount(Math.max(1, count));
    };

    requestAnimationFrame(doMeasure);

    const observer = new ResizeObserver(doMeasure);
    if (container) observer.observe(container);
    return () => observer.disconnect();
  }, [value]);

  const hiddenCount = value.length - visibleCount;

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden measurement container */}
      <div ref={measureRef} className="absolute inset-x-0 top-0 flex items-center gap-1.5 px-3 py-1.5 pointer-events-none opacity-0 overflow-hidden" style={{ height: 0 }}>
        {value.map((v) => (
          <span key={v.objectGUID} data-measure-chip className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium max-w-[200px] shrink-0 whitespace-nowrap">
            {v._label}
          </span>
        ))}
      </div>

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex min-h-[40px] w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          hasError ? "border-destructive" : "border-input",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {value.length === 0 ? (
          <span className="text-muted-foreground flex-1 text-right">{placeholder}</span>
        ) : (
          <div ref={chipsRef} className="flex-1 flex items-center gap-1.5 overflow-hidden">
            {value.slice(0, visibleCount).map((v) => (
              <span
                key={v.objectGUID}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium max-w-[200px] shrink-0"
              >
                <span className="truncate">{v._label}</span>
                <X
                  className="h-3 w-3 shrink-0 cursor-pointer hover:text-destructive transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUser(v.objectGUID);
                  }}
                />
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="inline-flex items-center bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium shrink-0">
                +{hiddenCount}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {value.length > 0 && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
            />
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-input bg-background shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Search */}
          <div className="flex items-center border-b border-input px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent py-2.5 px-2 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="ابحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {value.length > 0 && (
              <span className="text-xs text-primary font-medium shrink-0">{value.length} محدد</span>
            )}
          </div>

          {/* Options */}
          <div ref={scrollRef} onScroll={handleScroll} className="max-h-52 overflow-auto p-1">
            {options.map((opt: ManagerOption) => {
              const isChecked = selectedIds.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-right text-sm transition-colors flex items-center gap-2.5",
                    isChecked ? "bg-primary/5" : "hover:bg-accent",
                  )}
                  onClick={() => toggleUser(opt)}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "flex items-center justify-center shrink-0 w-4 h-4 rounded border transition-colors",
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-input",
                    )}
                  >
                    {isChecked && <Check className="h-3 w-3" />}
                  </div>
                  {/* Label */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="font-medium truncate">{opt.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{opt.subtitle}</div>
                  </div>
                </button>
              );
            })}
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
