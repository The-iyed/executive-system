import { useRef, useState, useEffect } from "react";
import { User, Mail, Phone, Building2, Badge } from "lucide-react";
import { ColumnConfig, TableRow } from "@/lib/dynamic-table-form";
import { Card,  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider  } from "@/lib/ui";
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
function TruncatedText({ text, dir, className }: { text: string; dir?: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [text]);

  const content = (
    <p ref={ref} className={`text-right truncate ${className ?? ""}`} dir={dir}>
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

const InviteeCard = ({ invitee, columns }: InviteeCardProps) => {
  const name = getDisplayValue(invitee.name || invitee.object_guid);
  const position = getDisplayValue(invitee.position);
  const email = getDisplayValue(invitee.email);
  const mobile = getDisplayValue(invitee.mobile);
  const sector = getDisplayValue(invitee.sector);
  const channelLabel = getChannelLabel(invitee.attendance_mechanism);
  const hasAccess = !!invitee.access_permission;
  const isConsultant = !!invitee.is_consultant;
  const isMeetingOwner = !!invitee.meeting_owner;

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="p-4 flex flex-col gap-3 border border-border/60 rounded-2xl shadow-sm">
        {/* Top: Badges (left) + Name/Position with avatar (right) */}
        <div className="flex items-start justify-between" dir="rtl">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <TruncatedText text={name} className="text-sm font-semibold text-foreground" />
              <TruncatedText text={position} className="text-xs text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0 ms-2">
            {hasColumn(columns, "access_permission") && hasAccess && (
              <Badge className="text-[11px] font-normal border-emerald-500/30 text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-0.5">
                صلاحية الاطلاع
              </Badge>
            )}
            {hasColumn(columns, "attendance_mechanism") && channelLabel && (
              <Badge className="text-[11px] font-normal border-primary/30 text-primary bg-primary/5 rounded-full px-2.5 py-0.5">
                {channelLabel}
              </Badge>
            )}
            {hasColumn(columns, "is_consultant") && isConsultant && (
              <Badge className="text-[11px] font-normal border-amber-500/30 text-amber-600 bg-amber-50 rounded-full px-2.5 py-0.5">
                مستشار
              </Badge>
            )}
            {hasColumn(columns, "meeting_owner") && isMeetingOwner && (
              <Badge className="text-[11px] font-normal border-blue-500/30 text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5">
                مالك الاجتماع
              </Badge>
            )}
          </div>
        </div>

        {/* Middle: Email + Phone side by side */}
        {(hasColumn(columns, "email") || hasColumn(columns, "mobile")) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" dir="rtl">
            {hasColumn(columns, "email") && (
              <div className="flex items-center gap-2.5 min-w-0 bg-muted/50 rounded-xl px-3 py-2.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border/50">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground whitespace-nowrap">البريد الإلكتروني</p>
                  <TruncatedText text={email} dir="ltr" className="text-xs text-foreground" />
                </div>
              </div>
            )}
            {hasColumn(columns, "mobile") && (
              <div className="flex items-center gap-2.5 min-w-0 bg-muted/50 rounded-xl px-3 py-2.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border/50">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">الجوال</p>
                  <TruncatedText text={mobile} dir="ltr" className="text-xs text-foreground" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom: Sector */}
        {hasColumn(columns, "sector") && (
          <div className="flex items-center gap-2.5 bg-muted/50 rounded-xl px-3 py-2.5" dir="rtl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border/50">
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">الجهة</p>
              <TruncatedText text={sector} className="text-xs text-foreground" />
            </div>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
};

export default InviteeCard;