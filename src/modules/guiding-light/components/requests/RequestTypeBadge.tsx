import { Video } from "lucide-react";
import type { MeetingRequestType } from "@gl/types/meeting-request";
import { cn } from "@gl/lib/utils";

const TYPE_CONFIG: Record<
  MeetingRequestType,
  { label: string; className: string; hasIcon?: boolean }
> = {
  external: {
    label: "خارجي",
    className: "bg-teal-50 text-teal-600 border-teal-200",
  },
  internal: {
    label: "داخلي",
    className: "bg-purple-50 text-purple-600 border-purple-200",
  },
  private: {
    label: "خاص",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
  new: {
    label: "اجتماع جديد",
    className: "bg-teal-50 text-teal-600 border-teal-200",
    hasIcon: true,
  },
  councils: {
    label: "مجالس ولجان",
    className: "bg-pink-50 text-pink-600 border-pink-200",
  },
};

interface RequestTypeBadgeProps {
  type: MeetingRequestType;
}

function RequestTypeBadge({ type }: RequestTypeBadgeProps) {
  const config = TYPE_CONFIG[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium",
        config.className
      )}
    >
      {config.hasIcon && <Video className="size-3.5" />}
      {config.label}
    </span>
  );
}

export { RequestTypeBadge };
