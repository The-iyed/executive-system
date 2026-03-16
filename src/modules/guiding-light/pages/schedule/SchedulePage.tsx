import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useScheduleStore } from "@gl/stores/schedule-store";
import { PageTitleRow } from "@gl/components/schedule/PageTitleRow";
import { MonthPicker } from "@gl/components/schedule/MonthPicker";
import { DayCalendarStrip } from "@gl/components/schedule/DayCalendarStrip";
import { WeekTabStrip } from "@gl/components/schedule/WeekTabStrip";
import { MeetingFilterChips } from "@gl/components/meetings/MeetingFilterChips";
import { MeetingsPanel } from "@gl/components/meetings/MeetingsPanel";
import { queryKeys } from "@gl/api/queryKeys";
import {
  getMinisterSchedule,
  mapMinisterScheduleToUI,
} from "@gl/api/unified";
import { getWeeksInMonth, getWeekIndexForDate } from "@gl/lib/weekly-calendar";
import { ARABIC_DAY_NAMES, ARABIC_MONTHS } from "@gl/lib/calendar";
import type { DailyScheduleData, WeekDayGroup } from "@gl/components/meetings/MeetingsPanel";
import type { ChartSegment } from "@gl/types/meeting-detail";
import { SchedulePageSkeleton } from "@gl/components/skeletons/SchedulePageSkeleton";
import { ProductTour, useProductTour } from "@gl/components/tour/ProductTour";
import { scheduleTourSteps } from "@gl/components/tour/tourSteps";
import { useTourStore } from "@gl/stores/tour-store";

function mergeSegmentsByLabel(segmentsArrays: ChartSegment[][]): ChartSegment[] {
  const byLabel: Record<string, { value: number; color: string }> = {};
  for (const arr of segmentsArrays) {
    for (const s of arr ?? []) {
      if (!byLabel[s.label]) byLabel[s.label] = { value: 0, color: s.color };
      byLabel[s.label].value += s.value;
    }
  }
  return Object.entries(byLabel).map(([label, { value, color }]) => ({
    label,
    value,
    color,
  }));
}

function formatDateForApi(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function SchedulePage() {
  const {
    selectedDate,
    viewMode,
    setSelectedDate,
    setMonth,
    setViewMode,
  } = useScheduleStore();
  const scheduleTour = useProductTour("schedule");
  const setOpenTour = useTourStore((s) => s.setOpenTour);

  useEffect(() => {
    setOpenTour(scheduleTour.open);
    return () => setOpenTour(null);
  }, [scheduleTour.open, setOpenTour]);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const dateStr = useMemo(
    () => formatDateForApi(selectedDate),
    [selectedDate]
  );

  const apiView = viewMode === "monthly" ? "daily" : viewMode;

  const currentWeekDays = useMemo(() => {
    if (viewMode !== "weekly") return [];
    const weeks = getWeeksInMonth(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
    );
    const idx = getWeekIndexForDate(selectedDate);
    return weeks[idx]?.days ?? [selectedDate];
  }, [viewMode, selectedDate]);

  const weeklyQueries = useQueries({
    queries: currentWeekDays.map((day) => ({
      queryKey: queryKeys.ministerSchedule(formatDateForApi(day), "daily"),
      queryFn: () =>
        getMinisterSchedule({ date: formatDateForApi(day), view: "daily" }),
      enabled: viewMode === "weekly" && currentWeekDays.length > 0,
    })),
  });

  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    isError: scheduleError,
  } = useQuery({
    queryKey: queryKeys.ministerSchedule(dateStr, apiView),
    queryFn: () =>
      getMinisterSchedule({ date: dateStr, view: apiView }),
    enabled: viewMode === "daily",
  });

  const scheduleDataMapped = useMemo(() => {
    if (!scheduleData) return null;
    return mapMinisterScheduleToUI(scheduleData);
  }, [scheduleData]);

  const weeklyMapped = useMemo(() => {
    if (viewMode !== "weekly" || weeklyQueries.length === 0) return [];
    return weeklyQueries.map((q) =>
      q.data ? mapMinisterScheduleToUI(q.data) : null,
    );
  }, [viewMode, weeklyQueries]);

  /** Per-day groups for weekly layout (697px container, day headings, 2-col cards) */
  const weekDays = useMemo((): WeekDayGroup[] => {
    if (viewMode !== "weekly" || currentWeekDays.length === 0) return [];
    return currentWeekDays.map((date, i) => ({
      date,
      arabicDayName: ARABIC_DAY_NAMES[date.getDay()],
      arabicMonthName: ARABIC_MONTHS[date.getMonth()],
      meetings: weeklyMapped[i]?.detailedMeetings ?? [],
    }));
  }, [viewMode, currentWeekDays, weeklyMapped]);

  /** Same shape as daily: for MeetingsPanel (same charts, filters, cards) */
  const weeklyScheduleData = useMemo((): DailyScheduleData | undefined => {
    if (weeklyMapped.length === 0 || weeklyMapped.some((m) => m === null))
      return undefined;
    const meetings = weeklyMapped.flatMap((m) => (m ? m.detailedMeetings : []));
    const totalMeetings = weeklyMapped.reduce((s, m) => s + (m?.totalMeetings ?? 0), 0);
    const donutDataByClassification = mergeSegmentsByLabel(
      weeklyMapped.map((m) => m?.donutDataByClassification ?? []),
    );
    const donutDataByType = mergeSegmentsByLabel(
      weeklyMapped.map((m) => m?.donutDataByType ?? []),
    );
    const donutDataByCategory = mergeSegmentsByLabel(
      weeklyMapped.map((m) => m?.donutDataByCategory ?? []),
    );
    const barData = mergeSegmentsByLabel(weeklyMapped.map((m) => m?.barData ?? []));
    return {
      meetings,
      donutDataByClassification,
      donutDataByType,
      donutDataByCategory,
      barData,
      totalMeetings,
    };
  }, [weeklyMapped]);

  const toggleFilter = useCallback((filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId],
    );
  }, []);

  const isDaily = viewMode === "daily";
  const isWeekly = viewMode === "weekly";
  const weeksInMonth = useMemo(
    () =>
      getWeeksInMonth(selectedDate.getFullYear(), selectedDate.getMonth()),
    [selectedDate],
  );
  const activeWeek = getWeekIndexForDate(selectedDate);
  const handleWeekChange = useCallback(
    (weekIndex: number) => {
      const week = weeksInMonth[weekIndex];
      if (week?.days[0]) setSelectedDate(week.days[0]);
    },
    [weeksInMonth, setSelectedDate],
  );

  const weeklyLoading = viewMode === "weekly" && weeklyQueries.some((q) => q.isLoading);
  const weeklyError = viewMode === "weekly" && weeklyQueries.some((q) => q.isError);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageTitleRow
            title="جدول أعمال الوزير"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onExportPdf={() => {}}
          />

          <div data-tour="schedule-month-picker">
            <MonthPicker selectedDate={selectedDate} onMonthChange={setMonth} />
          </div>
        </div>

        {viewMode === "monthly" ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-6 py-12 text-center">
            <p className="text-muted-foreground">
              عرض الشهر غير متوفر حالياً. يرجى استخدام العرض اليومي أو الأسبوعي.
            </p>
          </div>
        ) : isWeekly ? (
          <>
            <WeekTabStrip
              activeWeek={activeWeek}
              totalWeeks={weeksInMonth.length}
              onWeekChange={handleWeekChange}
            />


            <div className="mb-6 flex flex-wrap items-center gap-4">
              <MeetingFilterChips
                activeFilters={activeFilters}
                onToggle={toggleFilter}
              />
            </div>

            {weeklyLoading ? (
              <SchedulePageSkeleton />
            ) : (
              <MeetingsPanel
                activeFilters={activeFilters}
                dailyData={weeklyScheduleData}
                variant="weekly"
                weekDays={weekDays}
              />
            )}
          </>
        ) : (
          <>
            <div data-tour="schedule-day-strip">
              <DayCalendarStrip
                selectedDate={selectedDate}
                onDaySelect={setSelectedDate}
              />
            </div>


            <div data-tour="schedule-filters" className="mb-6 flex flex-wrap items-center gap-4">
              <MeetingFilterChips
                activeFilters={activeFilters}
                onToggle={toggleFilter}
              />
            </div>

            <div>
            {scheduleLoading ? (
              <SchedulePageSkeleton />
            ) : (
              <MeetingsPanel
                activeFilters={activeFilters}
                dailyData={
                  scheduleDataMapped
                    ? {
                        meetings: scheduleDataMapped.detailedMeetings,
                        donutDataByClassification:
                          scheduleDataMapped.donutDataByClassification,
                        donutDataByType: scheduleDataMapped.donutDataByType,
                        donutDataByCategory: scheduleDataMapped.donutDataByCategory,
                        barData: scheduleDataMapped.barData,
                        totalMeetings: scheduleDataMapped.totalMeetings,
                      }
                    : undefined
                }
              />
            )}
            </div>
          </>
        )}
      </div>
      <ProductTour tourId="schedule" steps={scheduleTourSteps} isOpen={scheduleTour.isOpen} onClose={scheduleTour.close} />
    </div>
  );
}

export { SchedulePage };
