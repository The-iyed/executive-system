import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/ui';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { listActions, type ActionItem } from '../../../data/contentApi';

interface ActionTitleSelectProps {
  value: string;
  onChange: (action: ActionItem) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ActionTitleSelect({ value, onChange, placeholder = 'ابحث واختر التوجيه...', disabled }: ActionTitleSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [options, setOptions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number; width: number }>({ top: 0, right: 0, width: 300 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load options when open or search changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    listActions({ search: debouncedSearch, limit: 20 })
      .then((actions) => { if (!cancelled) setOptions(actions); })
      .catch(() => { if (!cancelled) setOptions([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [open, debouncedSearch]);

  // Position dropdown & close on outside click
  useEffect(() => {
    if (!open) return;

    const updatePos = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownPos({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
          width: Math.max(rect.width, 300),
        });
      }
    };
    updatePos();

    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="rounded-lg border border-input bg-background shadow-xl animate-in fade-in-0 zoom-in-95"
          dir="rtl"
          style={{
            position: 'fixed',
            zIndex: 99999,
            top: dropdownPos.top,
            right: dropdownPos.right,
            width: dropdownPos.width,
          }}
        >
          <div className="flex items-center border-b border-input px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent py-2.5 px-2 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="ابحث في التوجيهات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  'w-full rounded-md px-3 py-2.5 text-right text-sm transition-colors hover:bg-accent',
                  opt.title === value && 'bg-accent font-medium',
                )}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                  setSearch('');
                }}
              >
                {opt.title}
              </button>
            ))}
            {isLoading && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && options.length === 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen(!open)}
              className={cn(
                'flex h-[44px] w-full max-w-[300px] items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all',
                'hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <span className={cn('text-right flex-1 truncate leading-relaxed', !value && 'text-muted-foreground')}>
                {value || placeholder}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ms-2" />
            </button>
          </TooltipTrigger>
          {value && (
            <TooltipContent side="top" className="max-w-[400px] text-right">
              <p className="whitespace-pre-wrap break-words">{value}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      {dropdown}
    </div>
  );
}
