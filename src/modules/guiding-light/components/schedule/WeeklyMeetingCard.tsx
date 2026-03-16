import { Clock, MapPin, Users } from "lucide-react";
import { cn } from "@gl/lib/utils";
import type { DetailedMeeting, MeetingCategory } from "@gl/types/meeting-detail";

interface WeeklyMeetingCardProps {
  meeting: DetailedMeeting;
  onClick?: () => void;
}

const CATEGORY_STYLES: Record<MeetingCategory, { bg: string; text: string; label: string }> = {
  internal: { bg: "bg-blue-50", text: "text-blue-700", label: "داخلي" },
  external: { bg: "bg-amber-50", text: "text-amber-700", label: "خارجي" },
  private: { bg: "bg-purple-50", text: "text-purple-700", label: "خاص" },
  new: { bg: "bg-emerald-50", text: "text-emerald-700", label: "جديد" },
  "late-priority": { bg: "bg-red-50", text: "text-red-700", label: "أولوية" },
};

function formatMeetingTime(meeting: DetailedMeeting): string {
  if (meeting.startTime && meeting.endTime)
    return `${meeting.startTime} - ${meeting.endTime}`;
  if (meeting.startTime) return meeting.startTime;
  if (meeting.endTime) return meeting.endTime;
  return meeting.time || "—";
}

function WeeklyMeetingCard({ meeting, onClick }: WeeklyMeetingCardProps) {
  const timeStr = formatMeetingTime(meeting);
  const cat = CATEGORY_STYLES[meeting.category] ?? CATEGORY_STYLES.internal;
  const attendeeCount = meeting.attendees?.length ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      dir="rtl"
      className={cn(
        "group box-border flex w-full cursor-pointer flex-col gap-3 rounded-xl border-2 border-transparent bg-white p-4",
        "shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20",
        "ring-1 ring-black/[0.06]"
      )}
    >
      {/* Top row: category badge + attendee count */}
      <div className="flex items-center justify-between">
        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cat.bg, cat.text)}>
          {cat.label}
        </span>
        {attendeeCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="size-3" aria-hidden />
            {attendeeCount}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className="w-full min-w-0 truncate text-right text-sm font-bold text-foreground leading-snug"
        title={meeting.title}
      >
        {meeting.title}
      </h3>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate text-xs">
          {meeting.location ?? "—"}
        </span>
      </div>

      {/* Time pill */}
      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
        <Clock className="size-3.5 shrink-0 text-primary/70" aria-hidden />
        <span className="text-xs font-medium text-primary/80">
          {timeStr}
        </span>
      </div>

      {/* Bottom accent line */}
      <div className="h-0.5 w-full rounded-full bg-gradient-to-l from-primary/30 via-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export { WeeklyMeetingCard };
