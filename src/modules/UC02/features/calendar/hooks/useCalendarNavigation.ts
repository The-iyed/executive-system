import { useState, useCallback } from 'react';
import type { CalendarViewMode } from '../types';

export function useCalendarNavigation(initialDate?: Date) {
  const [currentDate, setCurrentDate] = useState(initialDate ?? new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('weekly');

  const goNext = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (viewMode === 'daily') d.setDate(d.getDate() + 1);
      else d.setDate(d.getDate() + 7);
      return d;
    });
  }, [viewMode]);

  const goPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'monthly') d.setMonth(d.getMonth() - 1);
      else if (viewMode === 'daily') d.setDate(d.getDate() - 1);
      else d.setDate(d.getDate() - 7);
      return d;
    });
  }, [viewMode]);

  const goToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return {
    currentDate,
    viewMode,
    setCurrentDate,
    setViewMode,
    goNext,
    goPrevious,
    goToday,
  };
}
