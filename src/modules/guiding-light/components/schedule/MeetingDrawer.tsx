import type { CSSProperties } from "react";
import delegateIcon from "@gl/assets/icons/delegate.svg";
import aounLogo from "@gl/assets/icons/aoun-logo.svg";
import { useModalStore } from "@gl/stores/modal-store";
import {
  X,
  Clock,
  MapPin,
  Sparkles,
  FileText,
  Paperclip,
  Link,
  Users,
  Star,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@gl/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@gl/components/ui/avatar";
import type {
  DetailedMeeting,
  MeetingCategory,
  Attendee,
  AgendaItem,
  MeetingAttachment,
} from "@gl/types/meeting-detail";
import {
  MEETING_CLASSIFICATION_LABELS,
  MEETING_CATEGORY_API_LABELS,
} from "@gl/types/meeting-detail";
import { MeetingCardActions } from "@gl/components/meetings/MeetingCardActions";
import { useDocumentViewer } from "@gl/contexts/DocumentViewerContext";

/* ─────────────────── constants ─────────────────── */

const EXCLUDED_TAG_LABELS = [
  "داخلي", "خارجي", "خاص", "جديد", "أولوية متأخرة",
  "اجتماع جديد", "اجتماع ذو أولوية متأخرة",
  "مجالس ولجان", "المجالس واللجان",
  "يتطلب بروتوكول", "يتضمن محتوى",
] as const;

const TYPE_BADGE: Record<MeetingCategory, { label: string }> = {
  internal: { label: "داخلي" },
  external: { label: "خارجي" },
  private: { label: "خاص" },
  new: { label: "جديد" },
  "late-priority": { label: "أولوية متأخرة" },
};

/* ─────────────────── helpers ─────────────────── */

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const parts = timeStr.trim().split(/[:\s]/).filter(Boolean);
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const totalM = h * 60 + m + minutesToAdd;
  return `${String(Math.floor(totalM / 60) % 24).padStart(2, "0")}:${String(totalM % 60).padStart(2, "0")}`;
}

function previousMinutesFor(items: AgendaItem[], index: number): number {
  let sum = 0;
  for (let j = 0; j < index; j++) {
    if (items[j].durationMinutes != null) sum += items[j].durationMinutes;
  }
  return sum;
}

function agendaItemTitle(index: number, item: AgendaItem, startTime: string | undefined, prevMins: number): string {
  const num = index + 1;
  const mins = item.durationMinutes ?? 0;
  const durationStr = mins > 0 ? `${mins} دقيقة` : undefined;
  if (startTime && mins > 0) {
    const s = addMinutesToTime(startTime, prevMins);
    const e = addMinutesToTime(startTime, prevMins + mins);
    return `أجندة ${num} : ${s} - ${e} (${durationStr})`;
  }
  if (durationStr) return `أجندة ${num} (${durationStr})`;
  return `أجندة ${num}`;
}

function isMeetingOwner(a: Attendee) {
  return a.role?.includes("مالك") || a.role === "مالك الاجتماع";
}

const isExcluded = (l: string) => EXCLUDED_TAG_LABELS.includes(l as (typeof EXCLUDED_TAG_LABELS)[number]);

/* ─────────────────── sub-components ─────────────────── */

const consultantLabelStyle: CSSProperties = {
  fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
  fontWeight: 500,
  fontSize: "11px",
  lineHeight: "1.3",
  background: "linear-gradient(135deg, #3C6FD1, #048F86)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

function AttendeeLabel({ attendee }: { attendee: Attendee }) {
  const nameStr = `${attendee.name}${attendee.email ? ` (${attendee.email})` : ""}`;
  if (attendee.consultant) {
    return <span className="shrink-0 text-right text-[11px]" style={consultantLabelStyle}>{nameStr}</span>;
  }
  if (attendee.is_meeting_owner || isMeetingOwner(attendee)) {
    return <span className="shrink-0 text-right text-[11px] font-medium text-destructive">{nameStr}</span>;
  }
  return <span className="shrink-0 text-right text-[11px] text-foreground/80">{nameStr}</span>;
}

/* ─────────────────── main ─────────────────── */

interface MeetingDrawerProps {
  meeting: DetailedMeeting | null;
  open: boolean;
  onClose: () => void;
}

function MeetingDrawer({ meeting, open, onClose }: MeetingDrawerProps) {
  const { openViewer, openViewerWithUrl } = useDocumentViewer();
  const openModal = useModalStore((s) => s.openModal);

  const openAttachmentPreview = (a: MeetingAttachment) => {
    const name = a.file_name || "المستند";
    if (a.blob_url) openViewerWithUrl(a.blob_url, name);
    else if (a.id) openViewer(a.id, name);
  };

  return (
    <>
      {/* backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* drawer */}
      <div
        dir="rtl"
        className={cn(
          "fixed z-50 flex flex-col bg-card transition-all duration-300 ease-in-out rounded-2xl right-4 top-1/2 -translate-y-1/2 border border-border/40 overflow-hidden",
          open ? "opacity-100 visible" : "opacity-0 invisible translate-x-[calc(100%+1rem)]"
        )}
        style={{
          width: 540,
          height: 780,
          maxHeight: "calc(100vh - 32px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
        }}
      >
        {/* close */}
        <button
          onClick={onClose}
          className="absolute left-4 top-3 z-10 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60"
        >
          <X className="size-4" strokeWidth={1.8} />
        </button>

        {meeting ? (
          <DrawerContent
            meeting={meeting}
            openAttachmentPreview={openAttachmentPreview}
            openModal={openModal}
          />
        ) : null}
      </div>
    </>
  );
}

/* ─────────────────── drawer content ─────────────────── */

function DrawerContent({
  meeting,
  openAttachmentPreview,
  openModal,
}: {
  meeting: DetailedMeeting;
  openAttachmentPreview: (a: MeetingAttachment) => void;
  openModal: ReturnType<typeof useModalStore>["openModal"];
}) {
  const typeBadge = TYPE_BADGE[meeting.category];
  const classificationLabel = meeting.classification && MEETING_CLASSIFICATION_LABELS[meeting.classification];
  const categoryLabel = meeting.meetingClassification && MEETING_CATEGORY_API_LABELS[meeting.meetingClassification];
  const typePillLabel = meeting.typeLabel ?? typeBadge?.label;
  const showTypePill = typePillLabel && typePillLabel !== classificationLabel && !isExcluded(typePillLabel);

  const pillLabels = [
    categoryLabel && !isExcluded(categoryLabel) ? categoryLabel : null,
    classificationLabel && !isExcluded(classificationLabel) ? classificationLabel : null,
    showTypePill ? typePillLabel : null,
  ].filter(Boolean) as string[];

  const tagLabels = (meeting.tagLabels ?? []).filter(
    (label) => !isExcluded(label) && !pillLabels.includes(label) &&
      !(meeting.meetingClassification === "COUNCILS_AND_COMMITTEES" && (label === "مجالس ولجان" || label === "المجالس واللجان"))
  );

  const attachments = meeting.attachments ?? [];
  const executiveSummary = attachments.find((a) => a.is_executive_summary);
  const presentation = attachments.find((a) => a.is_presentation);
  const internalList = meeting.internalAttendees ?? meeting.attendees ?? [];
  const externalList = meeting.externalAttendees ?? [];
  const totalAttendees = internalList.length + externalList.length;

  const isPast = (() => {
    if (!meeting.meetingDate) return false;
    const now = new Date();
    if (meeting.startTime) {
      const [h, m] = meeting.startTime.split(":").map(Number);
      const meetingDateTime = new Date(`${meeting.meetingDate}T00:00:00`);
      meetingDateTime.setHours(h, m, 0, 0);
      return meetingDateTime < now;
    }
    const meetingDay = new Date(`${meeting.meetingDate}T23:59:59`);
    return meetingDay < now;
  })();

  const hasSmartBar = meeting.isImportant || meeting.isPriority || meeting.relevanceScore != null || meeting.aiDelegateeRecommendation;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Pills + attachments + title area */}
        <div className="px-5 pt-14 pb-3 space-y-3">
          {/* Title + pills on same line */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[15px] font-bold text-foreground leading-relaxed min-w-0 flex-1">
              {meeting.title}
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0 justify-end">
              {classificationLabel && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  {classificationLabel}
                </span>
              )}
              {categoryLabel && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  {categoryLabel}
                </span>
              )}
              {showTypePill && (
                <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                  {typePillLabel}
                </span>
              )}
              {tagLabels.map((label, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Attachments + time row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground/80 shrink-0">
              <Clock className="size-3.5 text-primary" />
              <span>{meeting.time}</span>
              {meeting.duration && <span className="text-muted-foreground font-normal">({meeting.duration})</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!executiveSummary}
                onClick={() => { if (executiveSummary && (executiveSummary.blob_url || executiveSummary.id)) openAttachmentPreview(executiveSummary); }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all border",
                  executiveSummary
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:shadow-sm active:scale-95 cursor-pointer"
                    : "bg-muted/50 text-muted-foreground/35 border-border/30 cursor-not-allowed"
                )}
              >
                <FileText className="size-3.5" />
                الملخص التنفيذي
              </button>
              <button
                type="button"
                disabled={!presentation}
                onClick={() => { if (presentation && (presentation.blob_url || presentation.id)) openAttachmentPreview(presentation); }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all border",
                  presentation
                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 hover:shadow-sm active:scale-95 cursor-pointer"
                    : "bg-muted/50 text-muted-foreground/35 border-border/30 cursor-not-allowed"
                )}
              >
                <Paperclip className="size-3.5" />
                العرض التقديمي
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {meeting.communication_mode === "PHYSICAL" && meeting.location && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="size-3" />
                <span className="max-w-[200px] truncate">{meeting.location}</span>
              </span>
            )}
            {meeting.communication_mode === "VIRTUAL" && meeting.meeting_link && (
              <a
                href={meeting.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Link className="size-3" />
                اتصال مرئي
              </a>
            )}
          </div>
        </div>

        {/* Goal */}
        {meeting.goal && (
          <div className="px-5 pb-3">
            <div className="flex items-start gap-2 text-right">
              <span className="shrink-0 text-[12px] font-bold text-primary">الهدف :</span>
              <span className="text-[12px] leading-relaxed text-foreground/80">{meeting.goal}</span>
            </div>
          </div>
        )}

        {/* ── Agenda (always expanded in drawer, matches card style) ── */}
        <div className="px-5 pb-3">
          <div className={cn(
            "w-full rounded-xl px-4 py-3 border",
            "bg-primary/5 border-primary/15"
          )}>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground/80 mb-3">
              الأجندة والدعم المطلوب
              {meeting.agenda?.length ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary">{meeting.agenda.length}</span>
              ) : null}
            </div>
            {meeting.agenda?.length ? (
              <div className="flex flex-col gap-2 w-full">
                {meeting.agenda.map((item, i) => {
                  const prevMins = previousMinutesFor(meeting.agenda ?? [], i);
                  const title = agendaItemTitle(i, item, meeting.startTime, prevMins);
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 bg-card p-3.5 shadow-sm">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-foreground leading-snug">{title}</p>
                        {item.description && (
                          <p className="text-[11px] leading-relaxed text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      {item.type && (
                        <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {item.type}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] text-muted-foreground/50">لا توجد أجندة</p>
            )}
          </div>
        </div>

        {/* ── Attendees (always expanded in drawer, matches card expanded style) ── */}
        <div className="border-t border-border/30 bg-muted/20 px-5 py-3">
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
              <Users className="size-3" />
              الحضور ({totalAttendees})
            </div>
            {internalList.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-primary tracking-wide">الحضور الداخليين ({internalList.length})</p>
                <div className="flex flex-row-reverse flex-wrap items-center gap-1.5 justify-end">
                  {internalList.map((attendee, i) => (
                    <div key={attendee.id} className="flex flex-row-reverse items-center gap-1.5">
                      {i > 0 && <div className="h-3 w-px bg-border/30" />}
                      <AttendeeLabel attendee={attendee} />
                      <Avatar className={cn("size-6 rounded-full border-[1.5px] bg-muted", isMeetingOwner(attendee) ? "border-destructive" : "border-primary/30")}>
                        {attendee.avatar ? <AvatarImage src={attendee.avatar} alt={attendee.name} /> : null}
                        <AvatarFallback className="text-[8px] font-semibold">{attendee.name?.trim()?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {externalList.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-amber-600 tracking-wide">الحضور الخارجيين ({externalList.length})</p>
                <div className="flex flex-row-reverse flex-wrap items-center gap-1.5 justify-end">
                  {externalList.map((attendee, i) => (
                    <div key={attendee.id} className="flex flex-row-reverse items-center gap-1.5">
                      {i > 0 && <div className="h-3 w-px bg-border/30" />}
                      <AttendeeLabel attendee={attendee} />
                      <Avatar className="size-6 rounded-full border-[1.5px] border-amber-300 bg-muted">
                        {attendee.avatar ? <AvatarImage src={attendee.avatar} alt={attendee.name} /> : null}
                        <AvatarFallback className="text-[8px] font-semibold">{attendee.name?.trim()?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions — hidden for past meetings */}
            {!isPast && (
              <div className="flex items-center gap-2 w-full justify-start pt-2 border-t border-border/20">
                <MeetingCardActions meetingId={meeting.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Smart Info Bar (matches card smart bar) ── */}
      {hasSmartBar && (
        <div className="relative overflow-hidden flex items-center gap-3 px-5 py-3 border-t border-white/5 bg-[#1a1a2e] shrink-0">
          {/* Decorative M SVGs */}
          <svg width="120" height="53" viewBox="0 0 72 32" fill="none" className="absolute -left-4 -top-2 opacity-[0.06]">
            <path d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z" fill="white" />
          </svg>
          <svg width="70" height="31" viewBox="0 0 72 32" fill="none" className="absolute right-1/3 -bottom-2 opacity-[0.04] rotate-12">
            <path d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z" fill="white" />
          </svg>

          {/* Relevance Score */}
          {meeting.relevanceScore != null && (() => {
            const score = meeting.relevanceScore;
            const circumference = 2 * Math.PI * 16;
            const offset = circumference - (score / 100) * circumference;
            const strokeColor = score >= 70 ? '#5BAB87' : score >= 40 ? '#d97706' : '#6b7280';
            return (
              <div className="relative z-10 flex items-center justify-center size-10 shrink-0">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
                </svg>
                <span className={cn("text-[10px] font-extrabold", score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-white/50")}>
                  {score}%
                </span>
              </div>
            );
          })()}

          {/* Priority Badge */}
          {meeting.isPriority && (
            <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-[10px] font-bold text-amber-400">
              <AlertTriangle className="size-3 text-amber-400" />
              اجتماع ذو أولوية
            </span>
          )}

          {/* Important Badge */}
          {meeting.isImportant && (
            <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-[10px] font-bold text-red-400">
              <Star className="size-3 fill-red-400 text-red-400" />
              اجتماع مهم
            </span>
          )}

          {/* AI Recommendation — hidden for past meetings */}
          {!isPast && meeting.aiDelegateeRecommendation && (
            <button
              type="button"
              onClick={() => { /* TODO: show MM response details */ }}
              className="relative z-10 flex-1 min-w-0 flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <svg className="w-7 h-4 shrink-0" viewBox="0 0 72 32" fill="none">
                <path d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z" fill="url(#paint0_drawer)" />
                <defs>
                  <linearGradient id="paint0_drawer" x1="56.5658" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5BAB87" />
                    <stop offset="1" stopColor="#3B6064" />
                  </linearGradient>
                </defs>
              </svg>
              <p className="text-[11px] text-white/70 truncate leading-relaxed">
                ينصحكم بالنظام بإنابة هذا الاجتماع إلى{" "}
                <span className="font-semibold text-emerald-400">{meeting.aiDelegateeRecommendation}</span>
              </p>
            </button>
          )}

          {/* Delegation Button — hidden for past meetings */}
          {!isPast && (
            <button
              type="button"
              className="relative z-10 shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 text-[11px] font-bold text-emerald-400 transition-all hover:bg-emerald-500/30 active:scale-95"
              onClick={() => openModal("delegation", { meetingId: meeting.id, aiRecommendation: meeting.aiDelegateeRecommendation })}
            >
              <img src={delegateIcon} alt="" className="size-3.5 shrink-0 pointer-events-none brightness-0 invert sepia saturate-[10] hue-rotate-[120deg]" />
              إنابة
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { MeetingDrawer };
