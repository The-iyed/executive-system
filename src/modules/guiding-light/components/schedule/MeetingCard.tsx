import { Clock } from "lucide-react";
import type { Meeting } from "@gl/types/schedule";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@gl/components/ui/button";
import { useModalStore } from "@gl/stores/modal-store";
import delegateIcon from "@gl/assets/icons/delegate.svg";

interface MeetingCardProps {
  meeting: Meeting;
  onClick?: () => void;
}

function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const openModal = useModalStore((s) => s.openModal);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="mb-4 flex items-start">
        <StatusBadge status={meeting.status} />
      </div>
      <h3 className="mb-1 text-sm font-bold text-foreground">
        {meeting.title}
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">{meeting.location}</p>
      <hr className="mb-4 border-border" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-4" />
          <span>{meeting.formattedTime}</span>
        </div>
        <Button
          size="sm"
          className="gap-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
          onClick={(e) => {
            e.stopPropagation();
            openModal("delegation", { meetingId: meeting.id, aiRecommendation: undefined });
          }}
        >
          <img src={delegateIcon} alt="" className="size-3.5 shrink-0" />
          إنابة
        </Button>
      </div>
    </div>
  );
}

export { MeetingCard };
