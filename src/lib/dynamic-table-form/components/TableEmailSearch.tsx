import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Search, Loader2, X, UserPlus, SearchX } from "lucide-react";
import { SearchOption, SearchFn } from "../types";
import { motion } from "framer-motion";
import {
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/ui";

interface TableEmailSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelectUser: (option: SearchOption) => void;
  onSwitchToExternal: (preserveValue?: string) => void;
  disabled?: boolean;
  isExternal: boolean;
  hasObjectGuid: boolean;
  searchFn: SearchFn;
  error?: string | null;
  showError?: boolean;
  className?: string;
  hasFieldError?: boolean;
  placeholder?: string;
}

export const TableEmailSearch: React.FC<TableEmailSearchProps> = ({
  value,
  onChange,
  onSelectUser,
  onSwitchToExternal,
  disabled,
  hasObjectGuid,
  searchFn,
  error,
  showError,
  className,
  hasFieldError,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const displayLabel = value || "";

  const doSearch = useCallback(
    (q: string) => {
      clearTimeout(debounceRef.current);
      if (q.length < 2) {
        setOptions([]);
        setLoading(false);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setHasSearched(false);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await searchFn(q);
          setOptions(results);
        } catch {
          setOptions([]);
        } finally {
          setLoading(false);
          setHasSearched(true);
        }
      }, 400);
    },
    [searchFn]
  );

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      doSearch(val);
    },
    [doSearch]
  );

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Focus input after popover opens (dialog steals focus)
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const resetState = useCallback(() => {
    setQuery("");
    setOptions([]);
    setHasSearched(false);
    setLoading(false);
    clearTimeout(debounceRef.current);
  }, []);

  const handleSelect = useCallback(
    (opt: SearchOption) => {
      onSelectUser(opt);
      resetState();
      setOpen(false);
    },
    [onSelectUser, resetState]
  );

  const handleManualEntry = useCallback(() => {
    const currentQuery = query;
    onSwitchToExternal(currentQuery || undefined);
    resetState();
    setOpen(false);
  }, [onSwitchToExternal, query, resetState]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSwitchToExternal();
      onChange("");
      resetState();
    },
    [onSwitchToExternal, onChange, resetState]
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (disabled || hasObjectGuid) return;
      if (!nextOpen) resetState();
      setOpen(nextOpen);
    },
    [disabled, hasObjectGuid, resetState]
  );

  // Block scroll events from bubbling up to the Dialog
  const handleListWheel = useCallback((e: React.WheelEvent) => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop === 0 && e.deltaY < 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
    if (!atTop && !atBottom) {
      e.stopPropagation();
    }
  }, []);

  // Same fix for touch scroll on mobile
  const touchStartY = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const el = listRef.current;
    if (!el) return;
    const deltaY = touchStartY.current - e.touches[0].clientY;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop === 0 && deltaY < 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight && deltaY > 0;
    if (!atTop && !atBottom) {
      e.stopPropagation();
    }
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-lg border bg-muted px-3 py-2 text-sm transition-all",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
              hasFieldError ? "border-destructive" : "border-input",
              disabled && "opacity-50 cursor-not-allowed",
              hasObjectGuid ? "cursor-default" : "cursor-pointer"
            )}
          >
            <span
              className={cn(
                "truncate text-right",
                !displayLabel && "text-muted-foreground"
              )}
              dir="ltr"
            >
              {displayLabel || placeholder || "ابحث بالبريد الإلكتروني..."}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {(value || hasObjectGuid) && (
                <span
                  role="button"
                  tabIndex={-1}
                  className="inline-flex items-center justify-center cursor-pointer"
                  onClick={handleClear}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </span>
              )}
              {!hasObjectGuid && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                />
              )}
            </div>
          </button>
        </PopoverTrigger>

        {!hasObjectGuid && (
          <PopoverContent
            className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[280px] flex flex-col max-h-[280px]"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => {
              const trigger = document.activeElement;
              if (trigger) e.preventDefault();
            }}
            style={{ zIndex: 9999 }}
          >
            {/* Search bar — fixed at top */}
            <div className="flex items-center border-b border-input px-3 gap-1 shrink-0" dir="rtl">
              <input
                ref={inputRef}
                className="flex-1 bg-transparent py-2 px-2 text-sm text-right outline-none placeholder:text-muted-foreground"
                placeholder="ابحث بالبريد الإلكتروني..."
                value={query}
                onChange={handleQueryChange}
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setOpen(false);
                    resetState();
                  }
                }}
              />
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              )}
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            {/* Scrollable results */}
            <div
              ref={listRef}
              className="flex-1 min-h-0 overflow-y-auto p-1"
              onWheel={handleListWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-right text-sm transition-colors hover:bg-accent",
                    opt.value === value && "bg-accent font-medium"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(opt);
                  }}
                >
                  <div className="font-medium">
                    {opt.raw?.displayNameAR || opt.raw?.givenName || opt.label}
                  </div>
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {opt.label}
                  </div>
                  {(opt.raw?.title || opt.raw?.department) && (
                    <div className="text-[11px] text-muted-foreground/60">
                      {opt.raw?.title}
                      {opt.raw?.title && opt.raw?.department ? " · " : ""}
                      {opt.raw?.department}
                    </div>
                  )}
                </button>
              ))}

              {loading && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && hasSearched && options.length === 0 && (
                <div className="py-3 text-center space-y-1">
                  <SearchX className="h-4 w-4 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">لا توجد نتائج</p>
                </div>
              )}
              {!loading && !hasSearched && query.length < 2 && (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  اكتب حرفين على الأقل للبحث
                </p>
              )}
            </div>

            {/* Manual entry button — fixed at bottom */}
            <div className="shrink-0 border-t border-input p-1.5">
              <button
                type="button"
                onClick={handleManualEntry}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>إضافة يدوية</span>
              </button>
            </div>
          </PopoverContent>
        )}
      </Popover>

      <div className="h-4 overflow-hidden mt-0.5">
        {showError && error ? (
          <motion.span
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-destructive leading-tight block truncate"
            title={error}
          >
            {error}
          </motion.span>
        ) : null}
      </div>
    </div>
  );
};