import type { Meeting } from "@gl/types/schedule";
import { MeetingCard } from "./MeetingCard";

interface MeetingCardsGridProps {
  meetings: Meeting[];
}

function MeetingCardsGrid({ meetings }: MeetingCardsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}

export { MeetingCardsGrid };
