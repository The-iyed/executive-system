import { useState } from "react";
import type { ChartSegment } from "@gl/types/meeting-detail";
import type { DetailedMeeting } from "@gl/types/meeting-detail";
import { DetailedMeetingCard } from "./DetailedMeetingCard";
import { BreakSeparator } from "./BreakSeparator";
import { DonutChart } from "./DonutChart";
import { MeetingDrawer } from "@gl/components/schedule/MeetingDrawer";
import { WeeklyMeetingCard } from "@gl/components/schedule/WeeklyMeetingCard";
import { EmptyState, EmptyCalendarSVG, EmptySearchSVG } from "@gl/components/ui/empty-states";

export interface DailyScheduleData {
  meetings: DetailedMeeting[];
  donutDataByClassification: ChartSegment[];
  donutDataByType: ChartSegment[];
  donutDataByCategory: ChartSegment[];
  barData: ChartSegment[];
  totalMeetings: number;
}

export interface WeekDayGroup {
  date: Date;
  arabicDayName: string;
  arabicMonthName: string;
  meetings: DetailedMeeting[];
}

interface MeetingsPanelProps {
  activeFilters: string[];
  /** Schedule data from minister schedule API (no mock fallback) */
  dailyData?: DailyScheduleData | undefined;
  /** When "weekly", use compact cards in 697px scrollable container with day groups */
  variant?: "daily" | "weekly";
  /** Per-day meetings for weekly view (required when variant === "weekly") */
  weekDays?: WeekDayGroup[];
}

function MeetingsPanel({ activeFilters, dailyData, variant = "daily", weekDays }: MeetingsPanelProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<DetailedMeeting | null>(null);
  const meetings = dailyData?.meetings ?? [];
  const donutDataByClassification = dailyData?.donutDataByClassification ?? [];
  const donutDataByType = dailyData?.donutDataByType ?? [];
  const donutDataByCategory = dailyData?.donutDataByCategory ?? [];
  const barData = dailyData?.barData ?? [];
  const totalMeetings = dailyData?.totalMeetings ?? 0;

  const filteredMeetings =
    activeFilters.length === 0
      ? meetings
      : meetings.filter(
          (m) =>
            activeFilters.includes(m.category) ||
            m.tags.some((t) => activeFilters.includes(t)),
        );

  const isWeekly = variant === "weekly" && weekDays && weekDays.length > 0;

  if (isWeekly) {
    return (
      <div className="w-full" dir="rtl">
        {/* Same layout as daily: sidebar (donut) + main content; in RTL sidebar is on the right */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Charts sidebar — in RTL appears on the right */}
          <div className="flex flex-col gap-4 lg:w-[320px] lg:shrink-0 lg:self-start lg:sticky lg:top-0">
            <DonutChart
              categoryData={donutDataByClassification}
              typeData={donutDataByType}
              categorySegmentData={donutDataByCategory}
              sectorData={barData}
              total={totalMeetings}
            />
          </div>

          {/* Scrollable list — full width */}
          <div className="flex-1 min-w-0 w-full">
            <div
              className="flex flex-col gap-4 overflow-y-auto scrollbar-hide w-full"
              style={{ maxHeight: "calc(100vh - 200px)" }}
            >
              {weekDays!.every((d) => d.meetings.length === 0) ? (
                <EmptyState
                  icon={<EmptyCalendarSVG />}
                  title="لا توجد اجتماعات"
                  description="لا توجد اجتماعات مجدولة لهذا الأسبوع"
                  className="rounded-2xl border border-dashed border-border bg-muted/30"
                />
              ) : weekDays!.map((day) => {
                const dayMeetings = day.meetings;
                if (dayMeetings.length === 0) return null;
                const dayNum = day.date.getDate();
                const year = day.date.getFullYear();
                return (
                  <div
                    key={day.date.toISOString()}
                    className="rounded-2xl border border-border/60 bg-muted/30 p-5"
                  >
                    {/* Day header */}
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-foreground">
                        {day.arabicDayName} {dayNum} {day.arabicMonthName} {year}
                      </h2>
                      <span className="flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {dayMeetings.length} اجتماعات
                      </span>
                    </div>
                    {/* Separator */}
                    <div className="mb-4 h-px w-full bg-border/60" />
                    {/* Cards grid */}
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                      {dayMeetings.map((meeting) => (
                        <WeeklyMeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          onClick={() => setSelectedMeeting(meeting)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <MeetingDrawer
          meeting={selectedMeeting}
          open={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full">
      {/* Stacked on small screens, side-by-side on lg */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Charts: row on small screens, sticky sidebar on lg */}
        <div className="flex flex-col gap-4 lg:w-[320px] lg:shrink-0 lg:self-start lg:sticky lg:top-0">
          <DonutChart
            categoryData={donutDataByClassification}
            typeData={donutDataByType}
            categorySegmentData={donutDataByCategory}
            sectorData={barData}
            total={totalMeetings}
          />
        </div>

        {/* Right: full-width grid, 2 cards per row */}
        <div data-tour="schedule-meetings" className="flex-1 min-w-0 w-full overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-hide">
          {filteredMeetings.length === 0 ? (
            <EmptyState
              icon={meetings.length === 0 ? <EmptyCalendarSVG /> : <EmptySearchSVG />}
              title={meetings.length === 0 ? "لا توجد اجتماعات" : "لا توجد نتائج تطابق التصفية"}
              description={meetings.length === 0 ? "لا توجد اجتماعات مجدولة لهذا اليوم" : "حاول تغيير معايير التصفية"}
              className="rounded-2xl border border-dashed border-border bg-muted/30"
            />
          ) : (
            <div className="grid w-full grid-cols-1 gap-4">
              {filteredMeetings.flatMap((meeting, i) => {
                const card = (
                  <div
                    key={meeting.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedMeeting(meeting)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedMeeting(meeting)}
                    className="cursor-pointer"
                  >
                    <DetailedMeetingCard meeting={meeting} />
                  </div>
                );
                const breakEl =
                  meeting.breakAfter && i < filteredMeetings.length - 1 ? (
                    <div key={`break-${meeting.id}`} className="col-span-full">
                      <BreakSeparator minutes={meeting.breakAfter} />
                    </div>
                  ) : null;
                return breakEl ? [card, breakEl] : [card];
              })}
            </div>
          )}
        </div>
      </div>

      <MeetingDrawer
        meeting={selectedMeeting}
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
      />
    </div>
  );
}

export { MeetingsPanel };
