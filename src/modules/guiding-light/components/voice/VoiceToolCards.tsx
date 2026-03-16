import { useMemo, useState } from "react";
import { CalendarDays, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Search, Clock, Users, MapPin, Shield, Briefcase, BarChart3, ArrowLeftRight, Timer, Award, ChevronDown, ChevronUp, Globe, Video, Building2 } from "lucide-react";
import { cn } from "@gl/lib/utils";
import { DonutChart } from "@gl/components/meetings/DonutChart";
import { BarsChart } from "@gl/components/meetings/BarsChart";
import { DetailedMeetingCard } from "@gl/components/meetings/DetailedMeetingCard";
import { apiMeetingToDetailedMeeting } from "@gl/api/unified";
import type { ChartSegment, DailyBarEntry, DetailedMeeting, MeetingCategory, MeetingTag, Attendee } from "@gl/types/meeting-detail";
import type { MinisterScheduleMeeting } from "@gl/api/unified/types";

// ── Types ───────────────────────────────────────────────────────────

interface ApiMeeting {
  id: string;
  meeting_title?: string;
  title?: string;
  subject?: string;
  meeting_subject?: string;
  description?: string;
  meeting_start_time?: string;
  start_time?: string;
  end_time?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  scheduled_at?: string;
  date?: string;
  location?: string;
  meeting_location?: string;
  communication_mode?: string;
  meeting_link?: string;
  meeting_type?: string;
  meeting_classification?: string;
  meeting_classification_type?: string;
  classification?: string;
  meeting_confidentiality?: string;
  meeting_channel?: string;
  sector?: string;
  request_number?: string;
  submitter_name?: string;
  meeting_owner_name?: string;
  invitees?: Invitee[];
  minister_attendees?: Invitee[];
  attendees?: Invitee[];
  invitees_count?: number;
  attendees_count?: number;
  type?: string;
  status?: string;
  is_urgent?: boolean;
  requires_protocol?: boolean;
  has_content?: boolean;
  is_data_complete?: boolean;
  presentation_duration?: number;
  duration_minutes?: number;
  selected_time_slot?: { slot_start: string; slot_end: string };
  agenda_items?: { heading?: string; title?: string; description?: string; agenda_item?: string; order?: number }[];
  minister_support?: { heading?: string; title?: string; description?: string }[];
  suggested_actions?: ActionItem[];
  deadline?: string;
  tags?: string[];
}

interface Invitee {
  id?: string;
  name?: string;
  external_name?: string;
  position?: string;
  attendance_mechanism?: string;
  response_status?: string;
  is_required?: boolean;
  sector?: string;
  mobile?: string;
}

interface ActionItem {
  id: number;
  title: string;
  status?: string;
  due_date?: string;
  assignees?: string | string[];
  is_completed?: boolean;
  priority?: string;
  assignee?: string;
  created_date?: string;
  meeting_id?: number;
}

interface ActionStats {
  total?: number;
  total_actions?: number;
  completed?: number;
  completed_actions?: number;
  pending?: number;
  pending_actions?: number;
  late?: number;
  late_actions?: number;
  completed_late?: number;
  completed_on_time?: number;
  no_due_date_actions?: number;
  completion_rate?: number;
  on_time_completion_rate?: number;
  late_rate?: number;
  avg_completion_time?: number;
  avg_completion_time_days?: number;
  top_users?: { name: string; total: number }[];
  top_users_by_total?: UserStat[];
  top_users_by_completed?: UserStat[];
  top_users_by_late?: UserStat[];
  top_users_by_on_time_rate?: UserStat[];
}

interface UserStat {
  email: string;
  total_actions: number;
  completed_actions: number;
  pending_actions: number;
  late_actions: number;
  completion_rate: number;
  on_time_rate: number;
}

interface StatEntry {
  name: string;
  count: number;
  pct?: number;
}

interface SummaryData {
  type: string;
  period: string;
  total_meetings: number;
  avg_presentation_duration?: number;
  max_presentation_duration?: number;
  min_presentation_duration?: number;
  total_duration?: number;
  avg_invitees?: number;
  total_invitees?: number;
  total_attendees?: number;
  avg_attendees?: number;
  max_invitees?: number;
  days_with_meetings?: number;
  avg_meetings_per_day?: number;
  urgent_count?: number;
  protocol_count?: number;
  has_content_count?: number;
  data_complete_count?: number;
  by_type?: StatEntry[];
  by_sector?: StatEntry[];
  by_classification?: StatEntry[];
  by_classification_type?: StatEntry[];
  by_channel?: StatEntry[];
  by_confidentiality?: StatEntry[];
  by_day_of_week?: StatEntry[];
  by_hour?: StatEntry[];
  by_tags?: StatEntry[];
  by_owner?: StatEntry[];
  by_urgency?: StatEntry[];
  by_protocol?: StatEntry[];
  meetings?: ApiMeeting[];
  summary?: {
    total_meetings: number;
    distribution_by_sector?: { sector?: string; label?: string; color?: string; value?: number; count?: number }[];
  };
  grouped_by_type?: Record<string, any[]>;
  grouped_by_classification_type?: Record<string, any[]>;
  grouped_by_classification?: Record<string, any[]>;
}

export interface ToolResultData {
  tool: string;
  data: unknown;
}

// ── Helpers ─────────────────────────────────────────────────────────

const CLASSIFICATION_LABELS: Record<string, string> = {
  COUNCILS_AND_COMMITTEES: "مجالس ولجان",
  COUNCILS_AND_COMMITTEES_INTERNAL: "مجالس ولجان داخلية",
  COUNCILS_AND_COMMITTEES_EXTERNAL: "مجالس ولجان خارجية",
  EVENTS_AND_VISITS: "فعاليات وزيارات",
  STRATEGIC: "استراتيجي",
  OPERATIONAL: "تشغيلي",
  SPECIAL: "خاص",
  INTERNAL: "داخلي",
  EXTERNAL: "خارجي",
  CONFIDENTIAL: "سري",
  PUBLIC: "عام",
  PHYSICAL: "حضوري",
  VIRTUAL: "عن بُعد",
  HYBRID: "هجين",
  MUNICIPAL_AFFAIRS: "الشؤون البلدية",
  PLANNING_AND_DEVELOPMENT: "التخطيط والتطوير",
  EMPOWERMENT_AND_COMPLIANCE: "التمكين والامتثال",
  HOUSING_AFFAIRS: "شؤون الإسكان",
  MINISTER_AFFILIATED: "المكتب الوزاري",
  SUPPORT_SERVICES: "الخدمات المساندة",
  INFRASTRUCTURE: "البنية التحتية",
  URBAN_PLANNING: "التخطيط الحضري",
  FINANCE: "المالية",
  HR: "الموارد البشرية",
  LEGAL: "الشؤون القانونية",
  IT: "تقنية المعلومات",
  COMMUNICATIONS: "الاتصالات",
  SUNDAY: "الأحد",
  MONDAY: "الإثنين",
  TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY: "الخميس",
  SATURDAY: "السبت",
  FRIDAY: "الجمعة",
  WORKSHOP: "ورشة عمل",
  BILATERAL_MEETING: "لقاء ثنائي",
  PRIVATE_MEETING: "لقاء خاص",
  BUSINESS: "أعمال",
  BUSINESS_OWNER: "أعمال",
  GOVERNMENT_CENTER_TOPICS: "مواضيع مركز الحكومة",
  DISCUSSION_WITHOUT_PRESENTATION: "مناقشة بدون عرض",
  NEW: "جديد",
  "LATE-PRIORITY": "أولوية متأخرة",
  PRIVATE: "خاص",
  TAKEN: "تم الأخذ",
  ADOPTED: "تم الاعتماد",
  OPEN: "مفتوح",
  CLOSED: "مغلق",
  PENDING: "معلّق",
  COMPLETED: "مكتمل",
  IN_PROGRESS: "قيد التنفيذ",
  LATE: "متأخر",
};

function label(key?: string): string {
  if (!key) return "";
  return CLASSIFICATION_LABELS[key] || key;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

function formatTimeRange(start?: string, end?: string): string {
  if (!start) return "";
  const s = formatTime(start);
  const e = end ? formatTime(end) : "";
  return e ? `${s} — ${e}` : s;
}

function parseAssignees(raw?: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [String(raw)];
  } catch {
    return [String(raw)];
  }
}

function extractMeetings(data: unknown): ApiMeeting[] {
  if (Array.isArray(data)) return data;
  const obj = data as Record<string, unknown>;
  if (obj?.items && Array.isArray(obj.items)) return obj.items;
  if (obj?.results && Array.isArray(obj.results)) return obj.results;
  if (obj?.meetings && Array.isArray(obj.meetings)) return obj.meetings;
  return [];
}

// ── Reusable UI atoms ───────────────────────────────────────────────

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "muted" }) {
  const styles = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    muted: "bg-muted text-muted-foreground",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium", styles[variant])}>{children}</span>;
}

function StatCard({ label: l, value, icon, suffix, color = "text-primary" }: { label: string; value: number | string; icon?: React.ReactNode; suffix?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
      {icon && <div className="flex justify-center mb-1.5 text-muted-foreground">{icon}</div>}
      <p className="text-[11px] text-muted-foreground">{l}</p>
      <p className={cn("text-2xl font-bold", color)}>
        {value}
        {suffix && <span className="text-xs font-normal text-muted-foreground mr-1">{suffix}</span>}
      </p>
    </div>
  );
}

function ProgressBar({ value, label: l, color = "bg-primary" }: { value: number; label: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-muted-foreground">{l}</p>
        <p className="text-sm font-bold text-primary">{value}%</p>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function BarMini({ items, title }: { items: StatEntry[]; title: string }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map(x => x.count), 1);
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-bold text-foreground">{title}</p>
      <div className="space-y-2">
        {items.slice(0, 6).map(s => (
          <div key={s.name} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-foreground truncate max-w-[60%]">{label(s.name)}</span>
              <span className="font-bold text-primary">{s.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary/70" style={{ width: `${(s.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Map API meeting → DetailedMeeting ───────────────────────────────

function mapApiToDetailedMeeting(m: ApiMeeting): DetailedMeeting {
  const slot = m.selected_time_slot;
  const startRaw = slot?.slot_start || m.meeting_start_time || m.scheduled_start || m.scheduled_at || m.date || "";
  const endRaw = slot?.slot_end || m.scheduled_end || "";

  const timeStr = formatTime(startRaw);
  const durationStr = m.presentation_duration
    ? `${m.presentation_duration} دقيقة`
    : endRaw ? (() => {
        try {
          const s = new Date(startRaw);
          const e = new Date(endRaw);
          const mins = Math.round((e.getTime() - s.getTime()) / 60000);
          return mins > 0 ? `${mins} دقيقة` : "٣٠ دقيقة";
        } catch { return "٣٠ دقيقة"; }
      })() : "٣٠ دقيقة";

  let category: MeetingCategory = "internal";
  const cls = m.meeting_classification?.toUpperCase();
  if (cls === "EXTERNAL" || m.meeting_type === "EXTERNAL") category = "external";
  if (m.meeting_confidentiality === "CONFIDENTIAL") category = "private";
  if (m.is_urgent) category = "late-priority";

  const tags: MeetingTag[] = [];
  if (m.meeting_type === "COUNCILS_AND_COMMITTEES") tags.push("councils");
  if (m.meeting_channel === "VIRTUAL") tags.push("video-call");
  if (m.requires_protocol) tags.push("requires-protocol");
  if (m.has_content) tags.push("has-content");

  const allInvitees = [...(m.invitees || []), ...(m.minister_attendees || [])];
  const attendees: Attendee[] = allInvitees.map((inv, i) => ({
    id: inv.id || `inv-${i}`,
    name: inv.external_name || inv.name || `مدعو ${i + 1}`,
    avatar: "",
    role: inv.position,
    group: inv.sector || (m.minister_attendees?.includes(inv) ? "معالي الوزير" : "الحضور"),
  }));

  // Use API agenda/support or fallback to mock data
  const agenda = m.agenda_items?.length
    ? m.agenda_items.map(a => ({ heading: a.heading || a.title || "", description: a.description || "" }))
    : [
        { heading: "مراجعة الأعمال والجدول اليومية", description: "استعراض المهام المنجزة والمتبقية وتحديث الجدول الزمني للمشاريع الحالية." },
        { heading: "مناقشة المستجدات", description: "عرض آخر التطورات والقرارات المتعلقة بالملفات الجارية." },
      ];

  const support = m.minister_support?.length
    ? m.minister_support.map(s => ({ heading: s.heading || s.title || "", description: s.description || "" }))
    : [
        { heading: "توفير البيانات المطلوبة", description: "تجهيز التقارير والإحصائيات اللازمة لدعم اتخاذ القرار." },
        { heading: "التنسيق مع الجهات المعنية", description: "متابعة الردود والملاحظات من الأطراف ذات العلاقة." },
      ];

  return {
    id: String(m.id || ""),
    title: m.meeting_title || m.title || m.subject || m.meeting_subject || "اجتماع",
    location: m.meeting_location || m.location,
    communication_mode: m.communication_mode ?? (m.meeting_channel === "VIRTUAL" ? "VIRTUAL" : undefined),
    meeting_link: m.meeting_link,
    category,
    tags,
    time: `${timeStr} | ${formatDate(startRaw)}`,
    duration: durationStr,
    attendees,
    agenda,
    support,
  };
}

// ── Meetings Grid ───────────────────────────────────────────────────

function MeetingsGrid({ meetings }: { meetings: any[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? meetings : meetings.slice(0, 5);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <CalendarDays className="size-4 text-primary" />
          <span>{meetings.length} اجتماع</span>
        </div>
      </div>
      <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
        {visible.map((m, i) => (
          <DetailedMeetingCard key={m.id || i} meeting={apiMeetingToDetailedMeeting(m as MinisterScheduleMeeting, [])} />
        ))}
      </div>
      {meetings.length > 5 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full rounded-xl border border-border py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          {showAll ? "عرض أقل" : `عرض الكل (${meetings.length})`}
        </button>
      )}
    </div>
  );
}

// ── Actions Grid ────────────────────────────────────────────────────

function ActionsGrid({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-foreground flex items-center gap-2">
        <AlertCircle className="size-4 text-primary" />
        {actions.length} إجراء
      </p>
      <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
        {actions.slice(0, 15).map((a, i) => {
          const isComplete = a.is_completed || a.status === "COMPLETED";
          const isLate = a.status === "LATE";
          const assignees = parseAssignees(a.assignees);
          return (
            <div key={a.id || i} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 size-5 shrink-0 rounded-full flex items-center justify-center",
                  isComplete ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : isLate ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                )}>
                  {isComplete ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">{a.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {a.status && (
                      <Badge variant={isComplete ? "success" : isLate ? "danger" : "warning"}>
                        {a.status === "LATE" ? "متأخر" : a.status === "IN_PROGRESS" ? "قيد التنفيذ" : a.status === "COMPLETED" ? "مكتمل" : a.status === "PENDING" ? "معلّق" : a.status}
                      </Badge>
                    )}
                    {a.due_date && (
                      <span className="flex items-center gap-1"><Clock className="size-3" />{formatDate(a.due_date)}</span>
                    )}
                    {a.created_date && (
                      <span className="text-[10px]">أُنشئ: {formatDate(a.created_date)}</span>
                    )}
                  </div>
                </div>
              </div>
              {assignees.length > 0 && (
                <div className="flex flex-wrap gap-1 pr-8">
                  {assignees.slice(0, 3).map((name, j) => (
                    <span key={j} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      <Users className="size-2.5" />{name}
                    </span>
                  ))}
                  {assignees.length > 3 && <span className="text-[10px] text-muted-foreground">+{assignees.length - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Action Stats Dashboard ──────────────────────────────────────────

function CircularProgress({ value, size = 80, strokeWidth = 7, color = "hsl(var(--primary))", label: l, sublabel }: { value: number; size?: number; strokeWidth?: number; color?: string; label: string; sublabel?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-bold text-foreground">{Math.round(value)}%</span>
      </div>
      <p className="text-[11px] font-medium text-foreground mt-1">{l}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground -mt-1">{sublabel}</p>}
    </div>
  );
}

function ActionStatsCard({ stats }: { stats: ActionStats }) {
  const [activeTab, setActiveTab] = useState<"total" | "completed" | "late" | "ontime">("total");

  const total = stats.total ?? stats.total_actions ?? 0;
  const completed = stats.completed ?? stats.completed_actions ?? 0;
  const pending = stats.pending ?? stats.pending_actions ?? 0;
  const late = stats.late ?? stats.late_actions ?? 0;
  const completedLate = stats.completed_late ?? 0;
  const completedOnTime = stats.completed_on_time ?? 0;
  const noDueDate = stats.no_due_date_actions ?? 0;
  const completionRate = stats.completion_rate ?? 0;
  const onTimeRate = stats.on_time_completion_rate ?? 0;
  const lateRate = stats.late_rate ?? 0;
  const avgDays = stats.avg_completion_time ?? stats.avg_completion_time_days ?? 0;

  const userLists: Record<string, UserStat[]> = {
    total: stats.top_users_by_total || [],
    completed: stats.top_users_by_completed || [],
    late: stats.top_users_by_late || [],
    ontime: stats.top_users_by_on_time_rate || [],
  };
  const currentUsers = userLists[activeTab] || [];
  const tabLabels: Record<string, string> = { total: "الأكثر إجراءات", completed: "الأكثر إنجازاً", late: "الأكثر تأخراً", ontime: "الأعلى التزاماً" };

  const donutSegments: ChartSegment[] = [
    ...(completed > 0 ? [{ label: "مكتملة", value: completed, color: "#2a9d8f" }] : []),
    ...(pending > 0 ? [{ label: "معلقة", value: pending, color: "#1a6b6b" }] : []),
    ...(late > 0 ? [{ label: "متأخرة", value: late, color: "#e76f51" }] : []),
  ];

  const statusBarData: { label: string; value: number; color: string; bg: string }[] = [
    { label: "مكتملة", value: completed, color: "bg-primary", bg: "bg-primary/10" },
    { label: "معلقة", value: pending, color: "bg-amber-500", bg: "bg-amber-500/10" },
    { label: "متأخرة", value: late, color: "bg-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">إحصائيات التوجيهات</p>
          <p className="text-[11px] text-muted-foreground">نظرة عامة على أداء الإجراءات</p>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "الإجمالي", value: total, icon: <Briefcase className="size-3.5" />, accent: "text-foreground", bgAccent: "bg-foreground/5" },
          { label: "مكتملة", value: completed, icon: <CheckCircle2 className="size-3.5" />, accent: "text-primary", bgAccent: "bg-primary/10" },
          { label: "متأخرة", value: late, icon: <AlertCircle className="size-3.5" />, accent: "text-destructive", bgAccent: "bg-destructive/10" },
          { label: "معلقة", value: pending, icon: <Clock className="size-3.5" />, accent: "text-amber-600", bgAccent: "bg-amber-500/10" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-3 space-y-2">
            <div className={cn("size-7 rounded-lg flex items-center justify-center", kpi.bgAccent, kpi.accent)}>{kpi.icon}</div>
            <p className={cn("text-xl font-bold", kpi.accent)}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Status distribution bar */}
      {total > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-bold text-foreground">توزيع الحالات</p>
          <div className="h-3 rounded-full bg-muted overflow-hidden flex">
            {statusBarData.map((s) => s.value > 0 && (
              <div key={s.label} className={cn("h-full transition-all duration-500", s.color)} style={{ width: `${(s.value / total) * 100}%` }} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            {statusBarData.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={cn("size-2.5 rounded-full", s.color)} />
                <span className="text-[10px] text-muted-foreground">{s.label}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Circular progress gauges */}
      {(completionRate > 0 || onTimeRate > 0 || lateRate > 0) && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-bold text-foreground mb-4">معدلات الأداء</p>
          <div className="flex items-center justify-around">
            {completionRate > 0 && (
              <div className="relative">
                <CircularProgress value={completionRate} color="hsl(var(--primary))" label="نسبة الإنجاز" size={90} />
              </div>
            )}
            {onTimeRate > 0 && (
              <div className="relative">
                <CircularProgress value={onTimeRate} color="#2a9d8f" label="في الوقت" size={90} />
              </div>
            )}
            {lateRate > 0 && (
              <div className="relative">
                <CircularProgress value={lateRate} color="hsl(var(--destructive))" label="نسبة التأخير" size={90} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion breakdown */}
      {(completedOnTime > 0 || completedLate > 0 || noDueDate > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {completedOnTime > 0 && (
            <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
              <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-3 text-primary" />
              </div>
              <p className="text-lg font-bold text-primary">{completedOnTime}</p>
              <p className="text-[10px] text-muted-foreground">في الوقت</p>
            </div>
          )}
          {completedLate > 0 && (
            <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
              <div className="size-6 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto">
                <Clock className="size-3 text-amber-600" />
              </div>
              <p className="text-lg font-bold text-amber-600">{completedLate}</p>
              <p className="text-[10px] text-muted-foreground">أُنجزت متأخرة</p>
            </div>
          )}
          {noDueDate > 0 && (
            <div className="rounded-xl border border-border bg-card p-3 text-center space-y-1">
              <div className="size-6 rounded-lg bg-muted flex items-center justify-center mx-auto">
                <ArrowLeftRight className="size-3 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-muted-foreground">{noDueDate}</p>
              <p className="text-[10px] text-muted-foreground">بدون موعد</p>
            </div>
          )}
        </div>
      )}

      {/* Donut Chart */}
      {donutSegments.length > 1 && (
        <DonutChart data={donutSegments} total={total} />
      )}

      {/* Avg completion time */}
      {avgDays > 0 && (
        <div className="rounded-xl border border-border bg-gradient-to-l from-primary/5 to-transparent p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Timer className="size-4 text-primary" />
            </div>
            <p className="text-xs font-medium text-foreground">متوسط وقت الإنجاز</p>
          </div>
          <p className="text-xl font-bold text-primary">{avgDays} <span className="text-xs font-normal text-muted-foreground">يوم</span></p>
        </div>
      )}

      {/* User Rankings with tabs */}
      {Object.values(userLists).some(l => l.length > 0) && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide border-b border-border bg-muted/30">
            {Object.entries(tabLabels).map(([key, lbl]) => {
              if (!userLists[key]?.length) return null;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold transition-colors border-b-2",
                    activeTab === key ? "border-primary text-primary bg-card" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
          <div className="p-4 space-y-1">
            {currentUsers.slice(0, 5).map((u, i) => {
              const barMax = currentUsers[0]?.total_actions || 1;
              const barWidth = (u.total_actions / barMax) * 100;
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                  <span className={cn(
                    "size-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2",
                    i === 0 ? "border-primary bg-primary/10 text-primary"
                      : i === 1 ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                  )}>
                    {i === 0 ? <Award className="size-4" /> : i + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="font-semibold text-foreground truncate text-xs">{u.email}</p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", i === 0 ? "bg-primary" : i === 1 ? "bg-primary/70" : "bg-primary/40")} style={{ width: `${barWidth}%` }} />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>الكل: {u.total_actions}</span>
                      <span>مكتمل: {u.completed_actions}</span>
                      <span>إنجاز: {u.completion_rate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Palette ────────────────────────────────────────────────

const DASH_PALETTE = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#0891b2",
  "#4f46e5", "#c026d3", "#e11d48", "#0d9488", "#ca8a04",
];

// ── Radial Stat ─────────────────────────────────────────────────────

function RadialStat({ value, label: l, color, max }: { value: number; label: string; color: string; max: number }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative size-[88px]">
        <svg viewBox="0 0 96 96" className="size-full -rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-foreground">
          {value}
        </span>
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground">{l}</span>
    </div>
  );
}

// ── Waffle Grid ─────────────────────────────────────────────────────

function WaffleGrid({ items, title }: { items: { label: string; value: number }[]; title: string }) {
  if (!items?.length) return null;
  const total = items.reduce((s, x) => s + x.value, 0);
  const cells: number[] = [];
  let rem = 64;
  items.forEach((item, i) => {
    const count = i === items.length - 1 ? rem : Math.round((item.value / total) * 64);
    const actual = Math.min(count, rem);
    for (let j = 0; j < actual; j++) cells.push(i);
    rem -= actual;
  });
  while (cells.length < 64) cells.push(items.length - 1);

  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/20 p-5 space-y-4">
      <p className="text-[13px] font-bold text-foreground text-center">{title}</p>
      <div className="grid grid-cols-8 gap-[5px] justify-items-center mx-auto max-w-[200px]">
        {cells.map((idx, i) => (
          <div
            key={i}
            className="size-[18px] rounded-[5px] transition-all duration-300 hover:scale-125 hover:shadow-md"
            style={{ backgroundColor: DASH_PALETTE[idx % DASH_PALETTE.length] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center pt-1">
        {items.map((item, i) => (
          <span key={item.label + i} className="inline-flex items-center gap-1.5 text-[10px]">
            <span className="size-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: DASH_PALETTE[i % DASH_PALETTE.length] }} />
            <span className="text-foreground font-medium">{item.label}</span>
            <span className="text-muted-foreground font-bold">{Math.round((item.value / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Stacked Bar ──────────────────────────────────────────

function StackedBar({ items, title }: { items: { label: string; value: number }[]; title: string }) {
  if (!items?.length) return null;
  const total = items.reduce((s, x) => s + x.value, 0);
  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/20 p-5 space-y-3">
      <p className="text-[13px] font-bold text-foreground text-center">{title}</p>
      <div className="flex gap-[3px] h-8 rounded-xl overflow-hidden">
        {items.map((item, i) => (
          <div
            key={item.label + i}
            className="h-full flex items-center justify-center text-[9px] font-bold text-white/90 transition-all duration-500 hover:brightness-110 first:rounded-r-xl last:rounded-l-xl"
            style={{
              width: `${Math.max((item.value / total) * 100, 3)}%`,
              backgroundColor: DASH_PALETTE[i % DASH_PALETTE.length],
            }}
          >
            {(item.value / total) * 100 > 8 ? item.value : ""}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
        {items.map((item, i) => (
          <span key={item.label + i} className="inline-flex items-center gap-1.5 text-[10px]">
            <span className="size-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: DASH_PALETTE[i % DASH_PALETTE.length] }} />
            <span className="text-foreground font-medium">{item.label}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline Bars ──────────────────────────────────────────────────

function SparkBars({ items, title, color = "#2563eb" }: { items: { label: string; value: number }[]; title: string; color?: string }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map(x => x.value), 1);
  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/20 p-5 space-y-3">
      <p className="text-[13px] font-bold text-foreground text-center">{title}</p>
      <div className="flex items-end justify-center gap-[6px]" style={{ height: 64 }}>
        {items.map((item, i) => {
          const h = Math.max((item.value / max) * 64, 4);
          return (
            <div key={item.label + i} className="flex flex-col items-center gap-1" style={{ width: 20 }}>
              <span className="text-[8px] font-bold text-muted-foreground">{item.value || ""}</span>
              <div
                className="w-full rounded-t-md transition-all duration-700"
                style={{ height: h, background: `linear-gradient(to top, ${color}, ${color}99)` }}
              />
              <span className="text-[7px] text-muted-foreground truncate w-full text-center">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat Chip ───────────────────────────────────────────────────────

function StatChip({ value, label: l, icon, color }: { value: string | number; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/20 p-3 flex items-center gap-2.5">
      <div className="size-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground leading-none mb-0.5">{l}</p>
        <p className="text-base font-extrabold text-foreground leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Summary Dashboard ───────────────────────────────────────────────

function SummaryDashboard({ data }: { data: SummaryData }) {
  const SECTOR_LABELS: Record<string, string> = {
    MUNICIPAL_AFFAIRS: "شؤون البلديات", HOUSING_AFFAIRS: "شؤون الإسكان",
    EMPOWERMENT_AND_COMPLIANCE: "التمكين والإمتثال", PLANNING_AND_DEVELOPMENT: "التخطيط والتطوير",
    SUPPORT_SERVICES: "الخدمات المساندة", MINISTER_AFFILIATED: "الجهات التابعة لمعالي الوزير",
  };
  const ALL_LABELS: Record<string, string> = { ...CLASSIFICATION_LABELS, ...SECTOR_LABELS };
  function translateLabel(key?: string): string {
    if (!key) return "غير محدد";
    return ALL_LABELS[key] || label(key);
  }

  const hasApiGrouped = data.grouped_by_type || data.grouped_by_classification_type || data.grouped_by_classification;
  function groupedToItems(grouped: Record<string, any[]> | undefined): { label: string; value: number }[] {
    if (!grouped) return [];
    return Object.entries(grouped).filter(([, arr]) => arr?.length > 0).map(([key, arr]) => ({ label: translateLabel(key), value: arr.length })).sort((a, b) => b.value - a.value);
  }
  function statToItems(entries?: StatEntry[]): { label: string; value: number }[] {
    if (!entries?.length) return [];
    return entries.map(e => ({ label: translateLabel(e.name), value: e.count })).sort((a, b) => b.value - a.value);
  }

  const byType = hasApiGrouped ? groupedToItems(data.grouped_by_type) : statToItems(data.by_type);
  const byClassificationType = hasApiGrouped ? groupedToItems(data.grouped_by_classification_type) : statToItems(data.by_classification_type);
  const byClassification = hasApiGrouped ? groupedToItems(data.grouped_by_classification) : statToItems(data.by_classification);

  const sectorItems = (data.summary?.distribution_by_sector || []).map((item) => ({
    label: SECTOR_LABELS[item.sector ?? ""] ?? SECTOR_LABELS[item.label ?? ""] ?? translateLabel(item.label || item.sector || ""),
    value: item.value ?? item.count ?? 0,
  }));
  const sectorData = sectorItems.length > 0 ? sectorItems : statToItems(data.by_sector);

  const dayBars = (data.by_day_of_week || []).map(e => ({ label: translateLabel(e.name), value: e.count }));
  const hourBars = (data.by_hour || []).map(e => ({ label: e.name, value: e.count }));
  const channelBars = statToItems(data.by_channel);

  const avgInvitees = data.avg_invitees ?? data.avg_attendees ?? 0;
  const avgDuration = data.avg_presentation_duration ?? 0;
  const daysCount = data.days_with_meetings ?? 0;
  const avgPerDay = data.avg_meetings_per_day ?? 0;
  const totalDuration = data.total_duration ?? 0;
  const urgentCount = data.urgent_count ?? 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-l from-[#2563eb]/10 via-card/90 to-card border border-border/20 p-5">
        <p className="text-[10px] text-muted-foreground mb-3">{data.period}</p>
        <div className="flex items-center justify-around">
          <RadialStat value={data.total_meetings} max={Math.max(data.total_meetings * 1.3, 30)} label="الاجتماعات" color="#2563eb" />
          {avgInvitees > 0 && <RadialStat value={Math.round(avgInvitees)} max={Math.max(Math.round(avgInvitees) * 2, 20)} label="متوسط الحضور" color="#7c3aed" />}
          {avgDuration > 0 && <RadialStat value={avgDuration} max={Math.max(avgDuration * 1.5, 60)} label="متوسط المدة (د)" color="#ea580c" />}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        {daysCount > 0 && <StatChip value={daysCount} label="أيام بها اجتماعات" icon={<CalendarDays className="size-4" />} color="#2563eb" />}
        {avgPerDay > 0 && <StatChip value={avgPerDay} label="متوسط يومي" icon={<TrendingUp className="size-4" />} color="#7c3aed" />}
        {totalDuration > 0 && <StatChip value={totalDuration > 60 ? `${Math.round(totalDuration / 60)} س` : `${totalDuration} د`} label="إجمالي المدة" icon={<Clock className="size-4" />} color="#ea580c" />}
        {urgentCount > 0 && <StatChip value={urgentCount} label="عاجلة" icon={<AlertCircle className="size-4" />} color="#e11d48" />}
      </div>

      {/* Classification — Waffle */}
      {byClassification.length > 0 && (
        <WaffleGrid items={byClassification} title="التوزيع حسب التصنيف" />
      )}

      {/* Type — Stacked bar */}
      {byType.length > 0 && (
        <StackedBar items={byType} title="حسب النوع" />
      )}

      {/* Classification type */}
      {byClassificationType.length > 0 && (
        <StackedBar items={byClassificationType} title="حسب فئة التصنيف" />
      )}

      {/* Sector */}
      {sectorData.length > 0 && (
        <WaffleGrid items={sectorData} title="حسب القطاع" />
      )}

      {/* Day of week */}
      {dayBars.length > 0 && (
        <SparkBars items={dayBars} title="الاجتماعات حسب اليوم" color="#4f46e5" />
      )}

      {/* Hour */}
      {hourBars.length > 0 && (
        <SparkBars items={hourBars.slice(0, 12)} title="الاجتماعات حسب الساعة" color="#2563eb" />
      )}

      {/* Channel */}
      {channelBars.length > 0 && (
        <StackedBar items={channelBars} title="حسب قناة الاجتماع" />
      )}
    </div>
  );
}

// ── Performance Dashboard ───────────────────────────────────────────

interface KpiItem { label: string; value: number; target: number; unit: string; trend: "up" | "down" | "stable"; change: number; }
interface Performer { name: string; department: string; tasks_completed: number; score: number; }

function PerformanceDashboard({ data }: { data: { kpis: KpiItem[]; top_performers: Performer[]; period: string } }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-primary" />
        <p className="text-sm font-bold text-foreground">أداء الموظفين — {data.period}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {data.kpis.map((kpi) => {
          const isPositive = (kpi.trend === "up" && kpi.change > 0) || (kpi.trend === "down" && kpi.change < 0);
          return (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {kpi.value}<span className="text-xs font-normal text-muted-foreground mr-1">{kpi.unit}</span>
              </p>
              <div className={cn("flex items-center justify-center gap-1 text-[11px] font-medium", isPositive ? "text-emerald-600" : "text-destructive")}>
                {kpi.trend === "up" ? <TrendingUp className="size-3" /> : kpi.trend === "down" ? <TrendingDown className="size-3" /> : null}
                {Math.abs(kpi.change)}{kpi.unit === "%" ? "%" : ""}
              </div>
            </div>
          );
        })}
      </div>
      {data.top_performers?.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-bold text-foreground">الأعلى أداءً</p>
          {data.top_performers.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "size-7 rounded-full flex items-center justify-center text-xs font-bold",
                  i === 0 ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
                )}>
                  {i === 0 ? <Award className="size-3.5" /> : i + 1}
                </span>
                <div>
                  <span className="font-medium text-foreground text-xs">{p.name}</span>
                  <span className="text-muted-foreground mr-2 text-[10px]">— {p.department}</span>
                </div>
              </div>
              <span className="font-bold text-primary text-xs">{p.score}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Web Search ──────────────────────────────────────────────────────

function WebSearchResults({ data }: { data: { query: string; results: { title?: string; snippet?: string; url?: string }[] } }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-foreground flex items-center gap-2">
        <Search className="size-4 text-primary" />
        نتائج البحث: {data.query}
      </p>
      <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
        {(data.results || []).slice(0, 5).map((r, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-1">
            <p className="text-sm font-medium text-foreground line-clamp-2">{r.title || "نتيجة"}</p>
            {r.snippet && <p className="text-xs text-muted-foreground line-clamp-3">{r.snippet}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Meeting Detail Card — reuses DetailedMeetingCard design ─────────

function MeetingDetailCard({ meeting: m }: { meeting: ApiMeeting }) {
  const detailed = mapApiToDetailedMeeting(m);
  return <DetailedMeetingCard meeting={detailed} />;
}


interface VoiceToolCardsProps {
  toolResult: ToolResultData;
}

function VoiceToolCards({ toolResult }: VoiceToolCardsProps) {
  const { tool, data } = toolResult;

  const content = useMemo(() => {
    if (!data) return null;

    switch (tool) {
      case "get_meetings_by_date_range":
      case "search_meetings":
      case "search_similar_meetings":
      case "get_waiting_list": {
        const meetings = extractMeetings(data);
        if (meetings.length === 0) return null;
        return <MeetingsGrid meetings={meetings} />;
      }

      case "get_meeting_details":
      case "get_action_meeting": {
        const m = data as ApiMeeting;
        if (!m?.id && !m?.title && !m?.meeting_title) return null;
        return <MeetingDetailCard meeting={m} />;
      }

      case "get_employee_performance": {
        const perf = data as { kpis: KpiItem[]; top_performers: Performer[]; period: string };
        if (!perf?.kpis) return null;
        return <PerformanceDashboard data={perf} />;
      }

      case "get_pending_actions":
      case "get_actions_by_name": {
        const actions = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.results || [];
        if (actions.length === 0) return null;
        return <ActionsGrid actions={actions} />;
      }

      case "get_actions_stats": {
        const stats = data as ActionStats;
        const hasData = (stats?.total != null) || (stats?.total_actions != null);
        if (!hasData) return null;
        return <ActionStatsCard stats={stats} />;
      }

      case "summarize_meetings": {
        const summary = data as SummaryData;
        if (!summary?.total_meetings && summary?.total_meetings !== 0) return null;
        return <SummaryDashboard data={summary} />;
      }

      case "web_search": {
        const search = data as { query: string; results: any[] };
        if (!search?.results?.length) return null;
        return <WebSearchResults data={search} />;
      }

      case "create_action": {
        const a = data as ActionItem;
        if (!a?.title) return null;
        return (
          <div className="rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-transparent p-4 dark:border-emerald-800/40 dark:from-emerald-950/30 dark:via-emerald-950/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shadow-inner">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">تم إنشاء الإجراء</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{a.title}</p>
              </div>
            </div>
          </div>
        );
      }

      case "create_directive": {
        const d = data as { id?: string; title?: string; status?: string; scheduling_officer_status?: string; created_at?: string };
        if (!d?.title) return null;
        const createdDate = d.created_at
          ? new Date(d.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : null;
        return (
          <div className="rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <p className="text-[13px] font-bold text-foreground">تم إنشاء التوجيه الوزاري</p>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border/20 px-4 py-3">
              <p className="text-[13px] font-semibold text-foreground leading-relaxed">{d.title}</p>
              {createdDate && (
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">{createdDate}</p>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  }, [tool, data]);

  if (!content) return null;

  return (
    <div className="w-full animate-in slide-in-from-bottom-2 duration-300" dir="rtl">
      {content}
    </div>
  );
}

export { VoiceToolCards };
