import { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@gl/lib/utils";

interface SearchInputProps {
  value: string;
  isActive: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onClear: () => void;
}

function SearchInput({
  value,
  isActive,
  onChange,
  onFocus,
  onClear,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    onClear();
    inputRef.current?.blur();
  }

  return (
    <div className="relative shrink-0">
      <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-white/40 sm:start-4 sm:size-5" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="يوفّر النظام أداة متقدمة للبحث في كافة بيانات وتفاصيل الاجتماعات..."
        className={cn(
          "h-10 w-full rounded-xl border bg-white/5 ps-10 text-xs text-white placeholder:text-white/40 focus:outline-none sm:h-12 sm:ps-12 sm:text-sm",
          isActive
            ? "border-white/20 pe-11"
            : "border-white/10 pe-4",
        )}
      />
      {isActive && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute end-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export { SearchInput };
