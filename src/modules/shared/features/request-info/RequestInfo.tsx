import { Hash, CalendarDays, BadgeCheck, UserRound, Building2 } from "lucide-react";
import type { RequestInfoProps, FieldCellProps } from "./types";
import { formatDateArabic, getMeetingStatusLabel } from "../../utils";

function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function FieldCell({ label, value, icon, isStatus = false }: FieldCellProps) {
  const isEmpty = value === "—";
  return (
    <div className="flex flex-col gap-1.5" dir="rtl">
      <p className="text-sm text-muted-foreground text-right">{label}</p>
      <div
        className={'flex items-center gap-2.5 px-4 py-3 rounded-2xl border bg-muted/40 border-border/40'}>
        <span
          className={`flex-shrink-0 text-muted-foreground`}
        >
          {icon}
        </span>

        <span
          className={`flex-1 text-sm font-medium truncate text-right text-foreground`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function RequestInfo({
  role,
  data,
  title = "معلومات الطلب",
  description = "البيانات الأساسية للطلب",
}: RequestInfoProps) {
  const requestNumber  = getDisplayValue(data.request_number);
  const requestDate    = data.request_date ? formatDateArabic(data.request_date) : "—";
  const requestStatus  = getMeetingStatusLabel(data.request_status, role);
  const submitter      = getDisplayValue(data.submitter_name);
  const meetingOwner   = getDisplayValue(data.meeting_owner_name);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="flex items-start justify-end gap-3" dir="ltr">
        <div className="text-right">
          <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
          <Hash className="w-4 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <FieldCell
          label="رقم الطلب"
          value={requestNumber}
          icon={<Hash className="w-4 h-4" />}
        />
        <FieldCell
          label="تاريخ الطلب"
          value={requestDate}
          icon={<CalendarDays className="w-4 h-4" />}
        />
        <FieldCell
          label="حالة الطلب"
          value={requestStatus}
          icon={<BadgeCheck className="w-4 h-4" />}
          isStatus
        />
        <FieldCell
          label="مقدم الطلب"
          value={submitter}
          icon={<UserRound className="w-4 h-4" />}
        />
        <FieldCell
          label="مالك الاجتماع"
          value={meetingOwner}
          icon={<Building2 className="w-4 h-4" />}
        />
      </div>
    </div>
  );
}