import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/ui";
import { ChevronDown, X, Check } from "lucide-react";
import type { ManagerOption } from "../hooks/useManagerSearch";
import type { UserSearchResult } from "../../api";

export interface ProposerSelection extends UserSearchResult {
  _label: string;
}

const STATIC_OPTIONS: ManagerOption[] = [
  {
    value: "EO@momah.gov.sa",
    label: "EO@momah.gov.sa",
    subtitle: "EO@momah.gov.sa",
    user: { objectGUID: "EO@momah.gov.sa", mail: "EO@momah.gov.sa", displayName: "EO@momah.gov.sa" } as UserSearchResult,
  },
  {
    value: "Minister.office@momah.gov.sa",
    label: "Minister.office@momah.gov.sa",
    subtitle: "Minister.office@momah.gov.sa",
    user: { objectGUID: "Minister.office@momah.gov.sa", mail: "Minister.office@momah.gov.sa", displayName: "Minister.office@momah.gov.sa" } as UserSearchResult,
  },
];

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
  placeholder = "اختر المقترحين...",
  disabled,
  hasError,
}: ProposersSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
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
          <div className="flex-1 flex items-center gap-1.5 overflow-hidden flex-wrap">
            {value.map((v) => (
              <span
                key={v.objectGUID}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium shrink-0"
              >
                <span className="truncate">{v._label}</span>
                <X
                  className="h-3 w-3 shrink-0 cursor-pointer hover:text-destructive transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUser(v.objectGUID!);
                  }}
                />
              </span>
            ))}
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
          <div className="p-1">
            {STATIC_OPTIONS.map((opt) => {
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
                  <div className="flex-1 min-w-0 text-right">
                    <div className="font-medium truncate">{opt.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
