import { useRef, useState, useEffect } from "react";
import { User, Mail, Phone, Building2 } from "lucide-react";
import { ColumnConfig, TableRow } from "@/lib/dynamic-table-form";
import { Card, Badge, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/lib/ui";
import { MEETING_CHANNEL_OPTIONS } from "../../types";

interface InviteeCardProps {
  invitee: TableRow;
  columns: ColumnConfig[];
}

function getChannelLabel(value: unknown): string | null {
  if (!value) return null;
  const opt = MEETING_CHANNEL_OPTIONS.find((o) => o.value === value);
  return opt?.label ?? (typeof value === "string" ? value : null);
}

function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function hasColumn(columns: ColumnConfig[], key: string): boolean {
  return columns.some((col) => col.key === key);
}

/** Text with tooltip that only appears when the text is actually truncated */
function TruncatedText({
  text,
  dir,
  className,
}: {
  text: string;
  dir?: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [text]);

  const content = (
    <p ref={ref} className={`truncate ${className ?? ""}`} dir={dir}>
      {text}
    </p>
  );

  if (!isTruncated || text === "-") return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-all text-xs" dir={dir}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/** Coloured avatar — green for owner, amber for consultant, blue otherwise */
function InviteeAvatar({
  isMeetingOwner,
  isConsultant,
}: {
  isMeetingOwner: boolean;
  isConsultant: boolean;
}) {
  const cls = isMeetingOwner
    ? "bg-green-50 text-green-700"
    : isConsultant
    ? "bg-amber-50 text-amber-700"
    : "bg-blue-50 text-blue-700";

  return (
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${cls}`}>
      <User className="w-[18px] h-[18px]" />
    </div>
  );
}

/** Reusable field row: icon + label + value */
function InfoField({
  icon,
  label,
  value,
  ltr = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  const isEmpty = value === "-";
  return (
    <div className="flex items-center gap-2.5 min-w-0 bg-muted/50 rounded-xl px-3 py-2.5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border/50">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</p>
        <TruncatedText
          text={value}
          dir={ltr ? "ltr" : undefined}
          className={`text-xs text-right ${isEmpty ? "text-muted-foreground/50" : "text-foreground"}`}
        />
      </div>
    </div>
  );
}

const InviteeCard = ({ invitee, columns }: InviteeCardProps) => {
  const position = getDisplayValue(invitee.position);
  const email = getDisplayValue(invitee.email);
  const rawName = getDisplayValue(invitee.name);
  const name = rawName !== "-" ? rawName : email.split('@')[0];
  const mobile = getDisplayValue(invitee.mobile);
  const sector = getDisplayValue(invitee.sector);
  const channelLabel = getChannelLabel(invitee.attendance_mechanism);
  const hasAccess = !!invitee.access_permission;
  const isConsultant = !!invitee.is_consultant;
  const isMeetingOwner = !!invitee.meeting_owner;
  const isPresenceRequired = !Boolean(invitee.is_presence_required);

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="flex flex-col gap-0 p-0 border border-border/60 rounded-2xl shadow-sm overflow-hidden">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 pb-3" dir="rtl">
          <InviteeAvatar isMeetingOwner={isMeetingOwner} isConsultant={isConsultant} />

          <div className="min-w-0 flex-1">
            {/* Email as name— latin text so force ltr */}
            <TruncatedText
              text={name}
              className="text-sm font-semibold text-foreground text-right"
            />

            {/* Position — skip row entirely if empty */}
            {position !== "-" && (
              <TruncatedText text={position} className="text-xs text-muted-foreground mt-0.5" />
            )}

            {/* Badges — priority order: owner > access > consultant > channel */}
            <div className="flex flex-wrap gap-1 mt-2">
              {hasColumn(columns, "meeting_owner") && isMeetingOwner && (
                <Badge className="text-[11px] font-normal rounded-full px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-500/30">
                  مالك الاجتماع
                </Badge>
              )}
              {hasColumn(columns, "access_permission") && hasAccess && (
                <Badge className="text-[11px] font-normal rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-500/30">
                  صلاحية الاطلاع
                </Badge>
              )}
              {hasColumn(columns, "is_consultant") && isConsultant && (
                <Badge className="text-[11px] font-normal rounded-full px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-500/30">
                  مستشار
                </Badge>
              )}
              {hasColumn(columns, "is_presence_required") && isPresenceRequired && (
                <Badge className="text-[11px] font-normal rounded-full px-2.5 py-0.5 bg-red-50 text-red-600 border border-red-500/30">
                  الحضور اختياري
                </Badge>
              )}
              {hasColumn(columns, "attendance_mechanism") && channelLabel && (
                <Badge className="text-[11px] font-normal rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-500/30">
                  {channelLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="h-px bg-border/40 mx-4" />

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 p-4 pt-3" dir="rtl">

          {/* Email + Mobile — two columns */}
          {(hasColumn(columns, "email") || hasColumn(columns, "mobile")) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {hasColumn(columns, "email") && (
                <InfoField
                  icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                  label="البريد الإلكتروني"
                  value={email}
                  ltr
                />
              )}
              {hasColumn(columns, "mobile") && (
                <InfoField
                  icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                  label="الجوال"
                  value={mobile}
                  ltr
                />
              )}
            </div>
          )}

          {/* Sector — full width */}
          {hasColumn(columns, "sector") && (
            <InfoField
              icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
              label="الجهة"
              value={sector}
            />
          )}

        </div>
      </Card>
    </TooltipProvider>
  );
};

export default InviteeCard;