import type { MeetingRequest } from "@gl/types/meeting-request";
import { RequestTypeBadge } from "./RequestTypeBadge";

interface MeetingRequestCardProps {
  request: MeetingRequest;
}

function MeetingRequestCard({ request }: MeetingRequestCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start">
        <RequestTypeBadge type={request.type} />
      </div>
      <h3 className="mb-1 text-sm font-bold text-foreground">
        {request.title}
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        {request.description}
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-primary">الهدف : </span>
        {request.goal}
      </p>
    </div>
  );
}

export { MeetingRequestCard };
