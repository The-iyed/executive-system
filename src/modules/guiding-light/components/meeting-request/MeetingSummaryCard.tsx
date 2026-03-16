import { Send } from "lucide-react";
import { Button } from "@gl/components/ui/button";
import { RequestTypeBadge } from "@gl/components/requests/RequestTypeBadge";
import type { MeetingRequestType } from "@gl/types/meeting-request";

interface MeetingSummaryCardProps {
  title: string;
  goal: string;
  type: MeetingRequestType;
  onSend: () => void;
}

function MeetingSummaryCard({
  title,
  goal,
  type,
  onSend,
}: MeetingSummaryCardProps) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start">
        <RequestTypeBadge type={type} />
      </div>

      <h3 className="mb-1 text-sm font-bold text-foreground">{title}</h3>

      <p className="mb-4 text-xs text-muted-foreground">
        <span className="font-semibold text-primary">الهدف : </span>
        {goal}
      </p>

      <Button
        className="w-full rounded-xl bg-linear-to-l from-[#048F86] to-[#6DCDCD] text-white hover:opacity-90"
        onClick={onSend}
      >
        إرسال
        <Send className="size-4" />
      </Button>
    </div>
  );
}

export { MeetingSummaryCard };
