import type { MeetingStatus } from "@gl/types/schedule";
import { cn } from "@gl/lib/utils";

const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; className: string }
> = {
  confirmed: {
    label: "مؤكد",
    className: "bg-emerald-50 text-emerald-600",
  },
  apologized: {
    label: "تم الاعتذار",
    className: "bg-slate-100 text-slate-500",
  },
  postponed: {
    label: "تم التأجيل",
    className: "bg-amber-50 text-amber-600",
  },
  unconfirmed: {
    label: "غير مؤكد",
    className: "bg-gray-100 text-gray-500",
  },
};

interface StatusBadgeProps {
  status: MeetingStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "rounded-md px-3 py-1 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export { StatusBadge };
