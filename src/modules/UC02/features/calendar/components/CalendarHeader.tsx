import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/ui';
import { Calendar } from '@/lib/ui/components/calendar';
import { ARABIC_MONTHS, ARABIC_DAY_NAMES } from '@/modules/guiding-light/lib/calendar';
import type { CalendarViewMode } from '../types';

const VIEW_MODES: { key: CalendarViewMode; label: string }[] = [
  { key: 'daily', label: 'يومي' },
  { key: 'weekly', label: 'أسبوعي' },
  { key: 'monthly', label: 'شهري' },
];

const FONT = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" } as const;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDisplayDate(date: Date, viewMode: CalendarViewMode): string {
  const dayName = ARABIC_DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const month = ARABIC_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  if (viewMode === 'daily') {
    return `${dayName} ${day} ${month} ${year}`;
  }
  if (viewMode === 'monthly') {
    return `${month} ${year}`;
  }
  // weekly — show week range
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} ${ARABIC_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${ARABIC_MONTHS[start.getMonth()]} - ${end.getDate()} ${ARABIC_MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateSelect: (date: Date) => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = memo(({
  currentDate,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onDateSelect,
  onViewModeChange,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isToday = isSameDay(currentDate, new Date());

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const handleDatePick = useCallback((date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      setPickerOpen(false);
    }
  }, [onDateSelect]);

  return (
    <div className="flex flex-row justify-between items-center flex-none px-5 py-4 bg-card rounded-2xl shadow-sm border border-border/40">
      {/* Title */}
      <div className="flex flex-row items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-foreground text-[16px]" style={FONT}>
            التقويم
          </h1>
          <p className="text-muted-foreground text-[11px]" style={FONT}>
            عرض الجدول الزمني للاجتماعات
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-row items-center gap-3">
        {/* View mode toggle */}
        <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
          {VIEW_MODES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewModeChange(key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-200',
                viewMode === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={FONT}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border/60" />

        {/* Today button */}
        <button
          type="button"
          onClick={onToday}
          disabled={isToday}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200',
            isToday
              ? 'bg-muted/40 text-muted-foreground/50 cursor-not-allowed'
              : 'bg-primary/10 text-primary hover:bg-primary/20',
          )}
          style={FONT}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          اليوم
        </button>

        {/* Prev */}
        <button
          type="button"
          onClick={onPrevious}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          aria-label="السابق"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {/* Date display — clickable for picker */}
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((p) => !p)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer select-none',
              pickerOpen ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/60 hover:bg-muted',
            )}
          >
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span className="text-[14px] font-bold text-foreground tabular-nums" style={FONT}>
              {formatDisplayDate(currentDate, viewMode)}
            </span>
          </button>

          {/* Date picker dropdown */}
          {pickerOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-card rounded-2xl shadow-lg border border-border/60 p-1 animate-in fade-in-0 zoom-in-95 duration-200">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDatePick}
                defaultMonth={currentDate}
              />
            </div>
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          aria-label="التالي"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';
