import type { Meeting } from "@gl/types/schedule";
import type { DetailedMeeting } from "@gl/types/meeting-detail";
import { MeetingCard } from "./MeetingCard";
import { DetailedMeetingCard } from "@gl/components/meetings/DetailedMeetingCard";
import { BreakSeparator } from "@gl/components/meetings/BreakSeparator";

interface WeeklyDaySectionProps {
  arabicDayName: string;
  dayNumber: number;
  arabicMonthName: string;
  year: number;
  meetings: Meeting[];
  /** When provided, same card as daily view (DetailedMeetingCard + break separators) */
  detailedMeetings?: DetailedMeeting[];
  onMeetingClick?: (meetingId: string) => void;
}

function WeeklyDaySection({
  arabicDayName,
  dayNumber,
  arabicMonthName,
  year,
  meetings,
  detailedMeetings,
  onMeetingClick,
}: WeeklyDaySectionProps) {
  const count = detailedMeetings?.length ?? meetings.length;
  if (count === 0) return null;

  return (
    <div className="bg-[#F6F9FD] border border-[#EBEBEB] p-4 rounded-xl">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-bold text-foreground">
          {arabicDayName} {dayNumber} {arabicMonthName} {year}
        </h2>
        <span className="text-sm text-muted-foreground">({count})</span>
      </div>

      {detailedMeetings && detailedMeetings.length > 0 ? (
        <div className="space-y-4">
          {detailedMeetings.map((meeting, i) => (
            <div key={meeting.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onMeetingClick?.(meeting.id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && onMeetingClick?.(meeting.id)
                }
                className="cursor-pointer"
              >
                <DetailedMeetingCard meeting={meeting} />
              </div>
              {meeting.breakAfter &&
                i < detailedMeetings.length - 1 && (
                  <div className="mt-4">
                    <BreakSeparator minutes={meeting.breakAfter} />
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onClick={() => onMeetingClick?.(meeting.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { WeeklyDaySection };
