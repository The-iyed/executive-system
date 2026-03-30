import { useState, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import delegateIcon from "@gl/assets/icons/delegate.svg";
import { useModalStore } from "@gl/stores/modal-store";
import {
  Clock,
  MapPin,
  Sparkles,
  FileText,
  Paperclip,
  ChevronDown,
  ChevronUp,
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
  AgendaItem,
  Attendee,
} from "@gl/types/meeting-detail";
import {
  MEETING_CLASSIFICATION_LABELS,
  MEETING_CATEGORY_API_LABELS,
} from "@gl/types/meeting-detail";
import { MeetingCardActions } from "./MeetingCardActions";
import { useDocumentViewer } from "@gl/contexts/DocumentViewerContext";
import type { MeetingAttachment } from "@gl/types/meeting-detail";
import { getMeetingAssessments, type MeetingAssessmentItem } from "@gl/api/unified/client";

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

interface DetailedMeetingCardProps {
  meeting: DetailedMeeting;
}

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const parts = timeStr.trim().split(/[:\s]/).filter(Boolean);
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const totalM = h * 60 + m + minutesToAdd;
  const nh = Math.floor(totalM / 60) % 24;
  const nm = totalM % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function agendaItemTitle(index: number, item: AgendaItem, meetingStartTime: string | undefined, previousMinutes: number): string {
  const num = index + 1;
  const mins = item.durationMinutes ?? 0;
  const durationStr = mins > 0 ? `${mins} دقيقة` : undefined;
  if (meetingStartTime && mins > 0) {
    const start = addMinutesToTime(meetingStartTime, previousMinutes);
    const end = addMinutesToTime(meetingStartTime, previousMinutes + mins);
    return `أجندة ${num} : ${start} - ${end} (${durationStr})`;
  }
  if (durationStr) return `أجندة ${num} (${durationStr})`;
  return `أجندة ${num}`;
}

function previousMinutesFor(items: AgendaItem[], index: number): number {
  let sum = 0;
  for (let j = 0; j < index; j++) {
    if (items[j].durationMinutes != null) sum += items[j].durationMinutes;
  }
  return sum;
}

function AgendaContent({ items, startTime }: { items: AgendaItem[]; startTime?: string }) {
  return (
    <div dir="rtl" className="flex flex-col gap-2 w-full">
      {items.map((item, i) => {
        const prevMins = previousMinutesFor(items, i);
        const title = agendaItemTitle(i, item, startTime, prevMins);
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
  );
}

function isMeetingOwner(attendee: Attendee) {
  return attendee.role?.includes("مالك") || attendee.role === "مالك الاجتماع";
}

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

function AvatarStack({ attendees, max = 4 }: { attendees: Attendee[]; max?: number }) {
  const shown = attendees.slice(0, max);
  const extra = attendees.length - max;
  return (
    <div className="flex flex-row-reverse items-center">
      {shown.map((a, i) => (
        <Avatar
          key={a.id}
          className="size-7 shrink-0 rounded-full border-2 border-card bg-muted"
          style={{ marginInlineEnd: i === 0 ? 0 : -6, zIndex: max - i }}
        >
          {a.avatar ? <AvatarImage src={a.avatar} alt={a.name} /> : null}
          <AvatarFallback className="text-[9px] font-semibold text-muted-foreground">
            {a.name?.trim()?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && (
        <span className="mr-1 text-[10px] font-medium text-muted-foreground">+{extra}</span>
      )}
    </div>
  );
}

function DetailedMeetingCard({ meeting }: DetailedMeetingCardProps) {
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [attendeesExpanded, setAttendeesExpanded] = useState(false);
  const openModal = useModalStore((s) => s.openModal);
  const typeBadge = TYPE_BADGE[meeting.category];
  const internalList = meeting.internalAttendees ?? meeting.attendees ?? [];
  const externalList = meeting.externalAttendees ?? [];
  const classificationLabel = meeting.classification && MEETING_CLASSIFICATION_LABELS[meeting.classification];
  const categoryLabel = meeting.meetingClassification && MEETING_CATEGORY_API_LABELS[meeting.meetingClassification];
  const { openViewer, openViewerWithUrl } = useDocumentViewer();
  const attachments = meeting.attachments ?? [];
  const executiveSummaryAttachment = attachments.find((a) => a.is_executive_summary);
  const presentationAttachment = attachments.find((a) => a.is_presentation);
  const typePillLabel = meeting.typeLabel ?? typeBadge?.label;

  // Fetch assessment data for smart bar
  const [assessments, setAssessments] = useState<MeetingAssessmentItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    getMeetingAssessments(meeting.id, 1)
      .then((res) => { if (!cancelled) setAssessments(res.items ?? []); })
      .catch(() => { /* silently ignore */ });
    return () => { cancelled = true; };
  }, [meeting.id]);

  const assessmentData = useMemo(() => {
    const item = assessments[0];
    if (!item) return null;
    const result = item.analysis_payload?.result;
    const assessment = item.assessment_payload;
    return {
      relevanceScore: result?.overall_score ?? assessment?.total_score ?? undefined,
      isImportant: result?.is_important ?? assessment?.is_important ?? false,
      isPriority: result?.is_urgent ?? assessment?.is_urgent ?? false,
      aiDelegateeRecommendation:
        (result?.delegation_recommendations?.[0]?.name ??
         assessment?.delegation_recommendations?.[0]?.name) || undefined,
    };
  }, [assessments]);

  const relevanceScore = assessmentData?.relevanceScore ?? meeting.relevanceScore;
  const isImportant = assessmentData?.isImportant ?? meeting.isImportant;
  const isPriority = assessmentData?.isPriority ?? meeting.isPriority;
  const aiDelegateeRecommendation = assessmentData?.aiDelegateeRecommendation ?? meeting.aiDelegateeRecommendation;

  const openAttachmentPreview = (a: MeetingAttachment) => {
    const name = a.file_name || "المستند";
    if (a.blob_url) openViewerWithUrl(a.blob_url, name);
    else if (a.id) openViewer(a.id, name);
  };

  const showTypePill = typePillLabel && typePillLabel !== classificationLabel && !EXCLUDED_TAG_LABELS.includes(typePillLabel as (typeof EXCLUDED_TAG_LABELS)[number]);
  const pillLabels = [
    categoryLabel && !EXCLUDED_TAG_LABELS.includes(categoryLabel as (typeof EXCLUDED_TAG_LABELS)[number]) ? categoryLabel : null,
    classificationLabel && !EXCLUDED_TAG_LABELS.includes(classificationLabel as (typeof EXCLUDED_TAG_LABELS)[number]) ? classificationLabel : null,
    showTypePill ? typePillLabel : null,
  ].filter(Boolean) as string[];
  const tagLabels = (meeting.tagLabels ?? []).filter(
    (label) =>
      !EXCLUDED_TAG_LABELS.includes(label as (typeof EXCLUDED_TAG_LABELS)[number]) &&
      !pillLabels.includes(label) &&
      !(meeting.meetingClassification === "COUNCILS_AND_COMMITTEES" && (label === "مجالس ولجان" || label === "المجالس واللجان"))
  );

  const totalAttendees = internalList.length + externalList.length;

  // Determine if meeting is in the past
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

  const hasSmartBar = isImportant || isPriority || relevanceScore != null || aiDelegateeRecommendation;

  return (
    <div dir="rtl" className="group rounded-2xl bg-card border-2 border-border text-right overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg hover:border-primary/40">
      {/* ── Header: tags (right) + attachments (left) ── */}
      <div className="flex items-center justify-between gap-2 px-5 py-3 bg-muted/30 border-b border-border/30">
        <div className="flex items-center gap-1.5 flex-wrap">
          {classificationLabel && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              {classificationLabel}
            </span>
          )}
          {categoryLabel && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              {categoryLabel}
            </span>
          )}
          {showTypePill && (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
              {typePillLabel}
            </span>
          )}
          {tagLabels.map((label, i) => (
            <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={!executiveSummaryAttachment}
            onClick={(e) => { e.stopPropagation(); if (executiveSummaryAttachment && (executiveSummaryAttachment.blob_url || executiveSummaryAttachment.id)) openAttachmentPreview(executiveSummaryAttachment); }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all border",
              executiveSummaryAttachment
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:shadow-sm active:scale-95 cursor-pointer"
                : "bg-muted/50 text-muted-foreground/35 border-border/30 cursor-not-allowed"
            )}
          >
            <FileText className="size-3.5" />
            الملخص التنفيذي
          </button>
          <button
            type="button"
            disabled={!presentationAttachment}
            onClick={(e) => { e.stopPropagation(); if (presentationAttachment && (presentationAttachment.blob_url || presentationAttachment.id)) openAttachmentPreview(presentationAttachment); }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all border",
              presentationAttachment
                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 hover:shadow-sm active:scale-95 cursor-pointer"
                : "bg-muted/50 text-muted-foreground/35 border-border/30 cursor-not-allowed"
            )}
          >
            <Paperclip className="size-3.5" />
            العرض التقديمي
          </button>
        </div>
      </div>

      {/* ── Title + time row ── */}
      <div className="px-5 pt-4 pb-3 space-y-2">
        <h3 className="text-[15px] font-bold text-foreground leading-relaxed">
          {meeting.title}
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground/80">
            <Clock className="size-3.5 text-primary" />
            <span>{meeting.time}</span>
            {meeting.duration && <span className="text-muted-foreground font-normal">({meeting.duration})</span>}
          </div>
          {meeting.communication_mode === "PHYSICAL" && meeting.location && (
            <>
              <div className="h-3.5 w-px bg-border/50" />
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="size-3" />
                <span className="max-w-[160px] truncate">{meeting.location}</span>
              </span>
            </>
          )}
          {meeting.communication_mode === "VIRTUAL" && meeting.meeting_link && (
            <>
              <div className="h-3.5 w-px bg-border/50" />
              <a
                href={meeting.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Link className="size-3" />
                اتصال مرئي
              </a>
            </>
          )}
        </div>
      </div>

      {/* ── Agenda ── */}
      <div className="px-5 pb-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setAgendaOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 transition-all border",
            agendaOpen
              ? "bg-primary/5 border-primary/15"
              : "bg-muted/40 border-border/30 hover:bg-muted/60 hover:border-border/50"
          )}
        >
          <span className="flex items-center gap-2 text-[12px] font-semibold text-foreground/80">
            الأجندة والدعم المطلوب
            {meeting.agenda?.length ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary">{meeting.agenda.length}</span>
            ) : null}
          </span>
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-300", agendaOpen && "rotate-180")} />
        </button>
        {agendaOpen && (
          <div className="mt-2.5 animate-fade-in">
            {meeting.agenda?.length ? (
              <AgendaContent items={meeting.agenda} startTime={meeting.startTime} />
            ) : (
              <p className="py-3 text-center text-[11px] text-muted-foreground/50">لا توجد أجندة</p>
            )}
          </div>
        )}
      </div>

      {/* ── Footer: Attendees + Actions ── */}
      <div className="border-t border-border/30 bg-muted/20 px-5 py-3" onClick={(e) => e.stopPropagation()}>
        <div className={cn("flex w-full gap-3", attendeesExpanded ? "flex-col" : "items-center justify-between")}>
          {/* Attendees */}
          <div className="flex min-w-0 flex-col gap-2">
            {!attendeesExpanded ? (
              <div className="flex items-center gap-2.5">
                {internalList.length > 0 && <AvatarStack attendees={internalList} />}
                {internalList.length > 0 && externalList.length > 0 && <div className="h-4 w-px bg-border/40" />}
                {externalList.length > 0 && <AvatarStack attendees={externalList} />}
                <button
                  type="button"
                  onClick={() => setAttendeesExpanded(true)}
                  className="flex items-center gap-1 rounded-lg border border-border/40 bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                >
                  <Users className="size-3" />
                  الحضور ({totalAttendees})
                  <ChevronDown className="size-2.5" />
                </button>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-3 animate-fade-in">
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
                <button
                  type="button"
                  onClick={() => setAttendeesExpanded(false)}
                  className="flex items-center gap-1 self-start rounded-lg px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                >
                  <ChevronUp className="size-2.5" />
                  إخفاء
                </button>
              </div>
            )}
          </div>

          {/* Actions — hidden for past meetings */}
          {!isPast && (
            <div data-tour="schedule-card-actions" className={cn("flex items-center gap-2", attendeesExpanded ? "w-full justify-start pt-2 border-t border-border/20" : "shrink-0")}>
              <MeetingCardActions meetingId={meeting.id} />
            </div>
          )}
        </div>
      </div>

      {/* ── Smart Info Bar ── */}
      {hasSmartBar && (
        <div data-tour="schedule-smart-bar" className="relative overflow-hidden flex items-center gap-3 px-5 py-3 border-t border-white/5 bg-[#1a1a2e] rounded-b-2xl">
          {/* Decorative M SVGs */}
          <svg width="120" height="53" viewBox="0 0 72 32" fill="none" className="absolute -left-4 -top-2 opacity-[0.06]">
            <path d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z" fill="white" />
          </svg>
          <svg width="70" height="31" viewBox="0 0 72 32" fill="none" className="absolute right-1/3 -bottom-2 opacity-[0.04] rotate-12">
            <path d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z" fill="white" />
          </svg>
          <svg width="50" height="22" viewBox="0 0 72 32" fill="none" className="absolute right-16 top-0 opacity-[0.03] -rotate-6">
            <path d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z" fill="white" />
          </svg>

          {/* Relevance Score */}
          {relevanceScore != null && (() => {
            const score = relevanceScore;
            const circumference = 2 * Math.PI * 16;
            const offset = circumference - (score / 100) * circumference;
            const strokeColor = score >= 70 ? '#5BAB87' : score >= 40 ? '#d97706' : '#6b7280';
            const importanceLabel = score >= 80 ? 'حرج' : score >= 60 ? 'مهم جداً' : score >= 40 ? 'مهم' : score >= 20 ? 'عادي' : 'منخفض';
            return (
              <div className="relative z-10 flex items-center gap-2 shrink-0">
                <div className="relative flex items-center justify-center size-10">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
                  </svg>
                  <span className={cn("text-[10px] font-extrabold", score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-white/50")}>
                    {Math.round(score)}%
                  </span>
                </div>
                <span className={cn("text-[10px] font-bold", score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-white/50")}>
                  {importanceLabel}
                </span>
              </div>
            );
          })()}

          {/* Priority Badge */}
          {isPriority && (
            <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-[10px] font-bold text-amber-400">
              <AlertTriangle className="size-3 text-amber-400" />
              اجتماع ذو أولوية
            </span>
          )}

          {/* Important Badge */}
          {isImportant && (
            <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-[10px] font-bold text-red-400">
              <Star className="size-3 fill-red-400 text-red-400" />
              اجتماع مهم
            </span>
          )}

          {/* AI Recommendation — hidden for past meetings */}
          {!isPast && aiDelegateeRecommendation && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); /* TODO: show MM response details */ }}
              className="relative z-10 flex-1 min-w-0 flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <svg className="w-7 h-4 shrink-0" viewBox="0 0 72 32" fill="none">
                <path d="M37.8174 0C42.1018 0 45.5752 3.47342 45.5752 7.75781L36.7773 32H25.5352L33.8447 7.75781H20.04L11.2422 32H0L8.30957 7.75781H20.04L22.7871 0H37.8174ZM63.3535 0C67.6377 0.000224723 71.1113 3.47356 71.1113 7.75781L62.3135 32H51.0713L59.3809 7.75781H45.5762L48.3232 0H63.3535Z" fill="url(#paint0_smartbar)" />
                <defs>
                  <linearGradient id="paint0_smartbar" x1="56.5658" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5BAB87" />
                    <stop offset="1" stopColor="#3B6064" />
                  </linearGradient>
                </defs>
              </svg>
              <p className="text-[11px] text-white/70 truncate leading-relaxed">
                ينصحكم بالنظام بإنابة هذا الاجتماع إلى{" "}
                <span className="font-semibold text-emerald-400">{aiDelegateeRecommendation}</span>
              </p>
            </button>
          )}

          {/* Delegation Button — hidden for past meetings */}
          {!isPast && (
            <button
              type="button"
              className="relative z-10 shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 text-[11px] font-bold text-emerald-400 transition-all hover:bg-emerald-500/30 active:scale-95"
              onClick={(e) => { e.stopPropagation(); openModal("delegation", { meetingId: meeting.id, aiRecommendation: aiDelegateeRecommendation }); }}
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

export { DetailedMeetingCard };
