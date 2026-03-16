import { useState, useCallback } from "react";
import type { WeeklyDay } from "@gl/data/mock-weekly-meetings";
import type {
  ChartSegment,
  DailyBarEntry,
  DetailedMeeting,
} from "@gl/types/meeting-detail";
import { MOCK_DETAILED_MEETINGS } from "@gl/data/mock-meeting-details";
import { DonutChart } from "@gl/components/meetings/DonutChart";
import { BarsChart } from "@gl/components/meetings/BarsChart";
import { WeeklyDaySection } from "./WeeklyDaySection";
import { MeetingDrawer } from "./MeetingDrawer";

interface WeeklyMeetingsViewProps {
  weekDays: WeeklyDay[];
  donutData: ChartSegment[];
  donutTotal: number;
  barsData: DailyBarEntry[];
  /** When provided (e.g. from API), drawer uses these for detail; otherwise falls back to mock */
  detailedMeetings?: DetailedMeeting[];
}

function WeeklyMeetingsView({
  weekDays,
  donutData,
  donutTotal,
  barsData,
  detailedMeetings,
}: WeeklyMeetingsViewProps) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  const selectedMeeting = selectedMeetingId
    ? (detailedMeetings?.length
        ? detailedMeetings.find((m) => m.id === selectedMeetingId)
        : null) ??
      MOCK_DETAILED_MEETINGS.find((m) => m.id === selectedMeetingId) ??
      MOCK_DETAILED_MEETINGS[
        [...selectedMeetingId].reduce((s, c) => s + c.charCodeAt(0), 0) %
          MOCK_DETAILED_MEETINGS.length
      ] ??
      null
    : null;

  const handleMeetingClick = useCallback((meetingId: string) => {
    setSelectedMeetingId(meetingId);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedMeetingId(null);
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar — DOM-first renders on the visual right in RTL flex-row */}
      <div className="flex flex-col gap-4 lg:w-[320px] lg:shrink-0 lg:self-start lg:sticky lg:top-0">
        <DonutChart data={donutData} total={donutTotal} />
        <BarsChart data={barsData} />
      </div>

      {/* Day sections */}
      <div className="flex-1 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-hide">
        {weekDays.map((day) => (
          <WeeklyDaySection
            key={day.date.toISOString()}
            arabicDayName={day.arabicDayName}
            dayNumber={day.date.getDate()}
            arabicMonthName={day.arabicMonthName}
            year={day.date.getFullYear()}
            meetings={day.meetings}
            detailedMeetings={day.detailedMeetings}
            onMeetingClick={handleMeetingClick}
          />
        ))}
      </div>

      {/* Meeting detail drawer */}
      <MeetingDrawer
        meeting={selectedMeeting}
        open={!!selectedMeeting}
        onClose={handleDrawerClose}
      />
    </div>
  );
}

export { WeeklyMeetingsView };
