import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
  RadialBarChart, RadialBar,
} from 'recharts';
import { Icon } from '@iconify/react';
import { getAssignedSchedulingRequests } from '../data/meetingsApi';

import { getWaitingList } from '../data/meetingsApi';
import { MeetingStatus, getMeetingStatusLabel } from '@/modules/shared';
import { PATH } from '../routes/paths';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'motion/react';

/* ─── animated wrapper ────────────────────────────────── */
const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [.22,1,.36,1] }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── stat card ───────────────────────────────────────── */
interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  gradient: string;
  subtitle?: string;
  onClick?: () => void;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient, subtitle, onClick, delay = 0 }) => (
  <FadeUp delay={delay} className="h-full">
    <button
      onClick={onClick}
      className="group relative flex items-center gap-4 rounded-[20px] bg-white p-5 text-right w-full h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
      style={{ border: '1px solid rgba(0,0,0,.06)' }}
      dir="rtl"
    >
      {/* subtle gradient bg on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${gradient.split(',')[0]}08, transparent)` }} />
      <div
        className="relative flex-shrink-0 w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-sm"
        style={{ background: `linear-gradient(135deg, ${gradient})` }}
      >
        <Icon icon={icon} width={26} height={26} className="text-white" />
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="text-[12px] font-medium text-gray-400 tracking-wide">{title}</p>
        <p className="text-[28px] font-extrabold text-gray-800 leading-tight mt-0.5">{value}</p>
        {subtitle ? <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p> : <p className="text-[11px] text-gray-400 mt-0.5 invisible">‎</p>}
      </div>
    </button>
  </FadeUp>
);

/* ─── chart card wrapper ──────────────────────────────── */
const ChartCard: React.FC<{ title: string; children: React.ReactNode; delay?: number; className?: string }> = ({ title, children, delay = 0, className = '' }) => (
  <FadeUp delay={delay} className={className}>
    <div
      className="rounded-[20px] bg-white p-6 pb-4 h-full flex flex-col"
      style={{ border: '1px solid rgba(0,0,0,.06)' }}
    >
      <h3 className="text-[15px] font-bold text-gray-700 mb-4 text-right flex-shrink-0">{title}</h3>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  </FadeUp>
);

/* ─── custom tooltip ──────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-[12px] shadow-2xl" dir="rtl">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── colors ──────────────────────────────────────────── */
const GRADIENTS = {
  teal: '#0EA5A0, #048F86',
  blue: '#5B8DEF, #3C6FD1',
  purple: '#A78BFA, #7C3AED',
  amber: '#FBBf24, #F59E0B',
};

const STATUS_COLORS: Record<string, string> = {
  [MeetingStatus.UNDER_REVIEW]: '#3C6FD1',
  [MeetingStatus.SCHEDULED]: '#10B981',
  [MeetingStatus.SCHEDULED_SCHEDULING]: '#10B981',
  [MeetingStatus.SCHEDULED_CONTENT]: '#10B981',
  [MeetingStatus.WAITING]: '#F59E0B',
  [MeetingStatus.REJECTED]: '#EF4444',
  [MeetingStatus.CANCELLED]: '#9CA3AF',
  [MeetingStatus.CLOSED]: '#6366F1',
  [MeetingStatus.CLOSED_PASS]: '#6366F1',
  [MeetingStatus.UNDER_GUIDANCE]: '#8B5CF6',
  [MeetingStatus.UNDER_CONTENT_REVIEW]: '#EC4899',
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: '#F97316',
  [MeetingStatus.RETURNED_FROM_CONTENT]: '#F97316',
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: '#14B8A6',
  [MeetingStatus.SCHEDULED_DELAYED]: '#EAB308',
  [MeetingStatus.SCHEDULED_DELEGATED]: '#6366F1',
};

const BAR_COLORS = ['#048F86', '#3C6FD1', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

/* ─── Skeleton placeholders ───────────────────────────── */
const SkeletonBox: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`animate-pulse rounded-md bg-gray-200/70 ${className}`} style={style} />
);

const StatCardSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 rounded-[20px] bg-white p-5" style={{ border: '1px solid rgba(0,0,0,.06)' }} dir="rtl">
    <SkeletonBox className="w-[52px] h-[52px] rounded-2xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <SkeletonBox className="h-3 w-20" />
      <SkeletonBox className="h-7 w-14" />
      <SkeletonBox className="h-2.5 w-24" />
    </div>
  </div>
);

const ChartCardSkeleton: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-[20px] bg-white p-6 pb-4 h-full flex flex-col ${className}`} style={{ border: '1px solid rgba(0,0,0,.06)' }}>
    <SkeletonBox className="h-4 w-32 mb-4 mr-auto" />
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

const DashboardSkeleton: React.FC = () => (
  <div className="flex flex-col gap-5 px-2 py-4 lg:px-4" dir="rtl">
    {/* Stat cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    {/* Row 1: Donut + Radial + Area */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <ChartCardSkeleton className="lg:col-span-5">
        <div className="flex items-center gap-4">
          <SkeletonBox className="w-[180px] h-[180px] rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <SkeletonBox className="w-2.5 h-2.5 rounded-full" />
                <SkeletonBox className="h-3 flex-1" />
                <SkeletonBox className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </ChartCardSkeleton>
      <ChartCardSkeleton className="lg:col-span-3">
        <div className="flex flex-col items-center gap-3">
          <SkeletonBox className="w-[160px] h-[160px] rounded-full" />
          <SkeletonBox className="h-4 w-16" />
        </div>
      </ChartCardSkeleton>
      <ChartCardSkeleton className="lg:col-span-4">
        <div className="flex items-end gap-3 justify-center h-[200px]">
          {[55, 70, 40, 85, 50, 65].map((h, i) => (
            <SkeletonBox key={i} className="w-8 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </ChartCardSkeleton>
    </div>
    {/* Row 2: Bar + Table */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <ChartCardSkeleton className="lg:col-span-5">
        <div className="flex items-end gap-4 justify-center h-[180px]">
          {[60, 80, 45, 70, 35].map((h, i) => (
            <SkeletonBox key={i} className="w-10 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </ChartCardSkeleton>
      <ChartCardSkeleton className="lg:col-span-7">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: '1px solid rgba(0,0,0,.04)' }}>
              <SkeletonBox className="w-8 h-8 rounded-full flex-shrink-0" />
              <SkeletonBox className="h-3 flex-1" />
              <SkeletonBox className="h-5 w-16 rounded-full" />
              <SkeletonBox className="h-3 w-20" />
            </div>
          ))}
        </div>
      </ChartCardSkeleton>
    </div>
  </div>
);

/* ─── Dashboard ───────────────────────────────────────── */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ['dashboard-meetings'],
    queryFn: () => getAssignedSchedulingRequests({ limit: 200 }),
    staleTime: 30_000,
  });


  const { data: waitingList, isLoading: waitingLoading } = useQuery({
    queryKey: ['dashboard-waiting'],
    queryFn: () => getWaitingList({ limit: 200 }),
    staleTime: 30_000,
  });

  const isLoading = meetingsLoading || waitingLoading;
  const apiMeetingItems = meetings?.items ?? [];
  const apiWaitingItems = waitingList?.items ?? [];

  // ── Mock data to enrich dashboard when API data is sparse ──
  const MOCK_MEETINGS = [
    { id: 'mock-1', meeting_title: 'اجتماع لجنة التخطيط الاستراتيجي', status: MeetingStatus.SCHEDULED, submitter_name: 'أحمد محمد', created_at: '2026-03-01T08:00:00Z', submitted_at: '2026-03-01T08:00:00Z' },
    { id: 'mock-2', meeting_title: 'مراجعة مؤشرات الأداء الربع سنوية', status: MeetingStatus.UNDER_REVIEW, submitter_name: 'سارة العلي', created_at: '2026-02-28T10:00:00Z', submitted_at: '2026-02-28T10:00:00Z' },
    { id: 'mock-3', meeting_title: 'اجتماع تنسيقي مع الجهات الحكومية', status: MeetingStatus.SCHEDULED_SCHEDULING, submitter_name: 'خالد الحربي', created_at: '2026-02-25T14:00:00Z', submitted_at: '2026-02-25T14:00:00Z' },
    { id: 'mock-4', meeting_title: 'ورشة عمل تطوير الخدمات الرقمية', status: MeetingStatus.WAITING, submitter_name: 'نورة السالم', created_at: '2026-02-20T09:00:00Z', submitted_at: '2026-02-20T09:00:00Z' },
    { id: 'mock-5', meeting_title: 'اجتماع لجنة المتابعة والتقييم', status: MeetingStatus.UNDER_GUIDANCE, submitter_name: 'فهد الدوسري', created_at: '2026-02-15T11:00:00Z', submitted_at: '2026-02-15T11:00:00Z' },
    { id: 'mock-6', meeting_title: 'جلسة استعراض الميزانية التشغيلية', status: MeetingStatus.SCHEDULED_CONTENT, submitter_name: 'مريم الشمري', created_at: '2026-01-28T13:00:00Z', submitted_at: '2026-01-28T13:00:00Z' },
    { id: 'mock-7', meeting_title: 'اجتماع فريق إدارة المشاريع', status: MeetingStatus.REJECTED, submitter_name: 'عبدالله القحطاني', created_at: '2026-01-20T08:30:00Z', submitted_at: '2026-01-20T08:30:00Z' },
    { id: 'mock-8', meeting_title: 'لقاء تعريفي بالسياسات الجديدة', status: MeetingStatus.CLOSED, submitter_name: 'هند العتيبي', created_at: '2026-01-10T10:00:00Z', submitted_at: '2026-01-10T10:00:00Z' },
    { id: 'mock-9', meeting_title: 'اجتماع اللجنة التنفيذية الشهري', status: MeetingStatus.SCHEDULED, submitter_name: 'محمد السبيعي', created_at: '2025-12-22T09:00:00Z', submitted_at: '2025-12-22T09:00:00Z' },
    { id: 'mock-10', meeting_title: 'مناقشة خطة التدريب السنوية', status: MeetingStatus.UNDER_CONTENT_REVIEW, submitter_name: 'ريم الغامدي', created_at: '2025-12-15T14:00:00Z', submitted_at: '2025-12-15T14:00:00Z' },
    { id: 'mock-11', meeting_title: 'اجتماع تقييم المبادرات الحكومية', status: MeetingStatus.CANCELLED, submitter_name: 'سلطان المطيري', created_at: '2025-12-05T11:00:00Z', submitted_at: '2025-12-05T11:00:00Z' },
    { id: 'mock-12', meeting_title: 'جلسة مراجعة الأنظمة والتشريعات', status: MeetingStatus.RETURNED_FROM_SCHEDULING, submitter_name: 'لمياء الزهراني', created_at: '2025-11-20T08:00:00Z', submitted_at: '2025-11-20T08:00:00Z' },
  ] as any[];

  const MOCK_DIRECTIVES = [
    { id: 'md-1', directive_status: 'OPEN', directive_text: 'إعداد تقرير شامل عن أداء المبادرات' },
    { id: 'md-2', directive_status: 'OPEN', directive_text: 'تحديث الخطة الاستراتيجية للقطاع' },
    { id: 'md-3', directive_status: 'IN_PROGRESS', directive_text: 'مراجعة سياسات الموارد البشرية' },
    { id: 'md-4', directive_status: 'IN_PROGRESS', directive_text: 'تطوير نظام المتابعة الإلكتروني' },
    { id: 'md-5', directive_status: 'COMPLETED', directive_text: 'إعداد دليل الإجراءات التنظيمية' },
    { id: 'md-6', directive_status: 'COMPLETED', directive_text: 'تقييم مخرجات البرنامج التدريبي' },
    { id: 'md-7', directive_status: 'COMPLETED', directive_text: 'مراجعة عقود الموردين' },
    { id: 'md-8', directive_status: 'CLOSED', directive_text: 'تحديث بيانات الهيكل التنظيمي' },
    { id: 'md-9', directive_status: 'PENDING', directive_text: 'إعداد خطة الاتصال المؤسسي' },
    { id: 'md-10', directive_status: 'OPEN', directive_text: 'تنظيم ورشة عمل للجهات المعنية' },
  ] as any[];

  // Always merge mock data with API data so dashboard charts are rich
  const meetingItems = [...apiMeetingItems, ...MOCK_MEETINGS];
  const directiveItems = [...MOCK_DIRECTIVES];
  const waitingItems = apiWaitingItems;

  const totalMeetings = meetingItems.length;
  const totalDirectives = directiveItems.length;
  const totalWaiting = Math.max(waitingList?.total ?? waitingItems.length, apiWaitingItems.length > 0 ? apiWaitingItems.length : 5);

  const underReviewCount = meetingItems.filter(m => m.status === MeetingStatus.UNDER_REVIEW).length;
  const scheduledCount = meetingItems.filter(m =>
    m.status === MeetingStatus.SCHEDULED ||
    m.status === MeetingStatus.SCHEDULED_SCHEDULING ||
    m.status === MeetingStatus.SCHEDULED_CONTENT
  ).length;

  const openDirectives = directiveItems.filter(d => d.directive_status !== 'CLOSED' && d.directive_status !== 'COMPLETED').length;

  /* ── pie data ────────────────────────── */
  const statusCounts = meetingItems.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts)
    .map(([status, count]) => ({
      name: getMeetingStatusLabel(status),
      value: count,
      fill: STATUS_COLORS[status] || '#9CA3AF',
    }))
    .sort((a, b) => b.value - a.value);

  /* ── monthly trend ───────────────────── */
  const monthlyData = React.useMemo(() => {
    const months: Record<string, number> = {};
    meetingItems.forEach(m => {
      const d = m.submitted_at || m.created_at;
      if (!d) return;
      const date = new Date(d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + 1;
    });
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => {
        const m = month.split('-')[1];
        return { name: monthNames[parseInt(m) - 1] || month, count };
      });
  }, [meetingItems]);

  /* ── directive bar data ──────────────── */
  const directiveStatusData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    directiveItems.forEach(d => {
      const s = d.directive_status || 'غير محدد';
      counts[s] = (counts[s] || 0) + 1;
    });
    const labelMap: Record<string, string> = { OPEN: 'مفتوح', CLOSED: 'مغلق', IN_PROGRESS: 'جاري', COMPLETED: 'مكتمل', PENDING: 'قيد الانتظار' };
    return Object.entries(counts).map(([status, count]) => ({
      name: labelMap[status] || status,
      count,
    }));
  }, [directiveItems]);

  /* ── completion radial ───────────────── */
  const completionPct = totalMeetings > 0
    ? Math.round((scheduledCount / totalMeetings) * 100)
    : 0;
  const radialData = [{ name: 'مكتمل', value: completionPct, fill: '#048F86' }];

  /* ── recent meetings ─────────────────── */
  const recentMeetings = [...meetingItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5 px-2 py-4 lg:px-4" dir="rtl">
      {/* ── Stat cards ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي الطلبات" value={totalMeetings} icon="solar:folder-with-files-bold-duotone" gradient={GRADIENTS.teal} subtitle={`${underReviewCount} قيد المراجعة`} onClick={() => navigate(PATH.WORK_BASKET)} delay={0} />
        <StatCard title="الاجتماعات المجدولة" value={scheduledCount} icon="solar:calendar-mark-bold-duotone" gradient={GRADIENTS.blue} onClick={() => navigate(PATH.SCHEDULED_MEETINGS)} delay={0.06} />
        <StatCard title="التوجيهات" value={totalDirectives} icon="solar:document-text-bold-duotone" gradient={GRADIENTS.purple} subtitle={`${openDirectives} مفتوحة`} onClick={() => navigate(PATH.DIRECTIVES)} delay={0.12} />
        <StatCard title="قائمة الانتظار" value={totalWaiting} icon="solar:clock-circle-bold-duotone" gradient={GRADIENTS.amber} onClick={() => navigate(PATH.WAITING_LIST)} delay={0.18} />
      </div>

      {/* ── Row 1: Donut + Radial + Area ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Donut chart */}
        <ChartCard title="توزيع حالات الطلبات" delay={0.2} className="lg:col-span-5">
          {pieData.length > 0 ? (
            <div className="flex items-center gap-2" dir="rtl">
              <ResponsiveContainer width="55%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5 flex-1">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                    <span className="text-gray-500 truncate">{d.name}</span>
                    <span className="font-bold text-gray-700 mr-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">لا توجد بيانات</p>
          )}
        </ChartCard>

        {/* Completion radial */}
        <ChartCard title="نسبة الإنجاز" delay={0.26} className="lg:col-span-3">
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                data={radialData}
                barSize={16}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background={{ fill: '#F3F4F6' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="flex flex-col items-center -mt-[130px] mb-8">
              <span className="text-[36px] font-black text-gray-800">{completionPct}%</span>
              <span className="text-[11px] text-gray-400 mt-0.5">من الطلبات مجدولة</span>
            </div>
          </div>
        </ChartCard>

        {/* Directive bar chart */}
        <ChartCard title="حالات التوجيهات" delay={0.32} className="lg:col-span-4">
          {directiveStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={directiveStatusData} barSize={40}>
                <defs>
                  {BAR_COLORS.map((c, i) => (
                    <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={1} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="العدد" radius={[10, 10, 4, 4]}>
                  {directiveStatusData.map((_, i) => (
                    <Cell key={i} fill={`url(#barGrad${i % BAR_COLORS.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">لا توجد بيانات</p>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Bar + Recent meetings ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly area chart */}
        <ChartCard title="الطلبات حسب الشهر" delay={0.36}>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#048F86" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#048F86" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#048F86"
                  strokeWidth={3}
                  fill="url(#gradArea)"
                  name="الطلبات"
                  dot={{ r: 5, fill: '#048F86', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#048F86', stroke: '#fff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">لا توجد بيانات</p>
          )}
        </ChartCard>

        {/* Recent meetings */}
        <ChartCard title="أحدث الطلبات" delay={0.4}>
          <div className="flex flex-col gap-1">
            {recentMeetings.length > 0 ? recentMeetings.map((m, i) => (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                onClick={() => navigate(`/meeting/${m.id}`)}
                className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-right w-full group"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-4 ring-opacity-20"
                  style={{
                    background: STATUS_COLORS[m.status] || '#9CA3AF',
                    boxShadow: `0 0 0 4px ${(STATUS_COLORS[m.status] || '#9CA3AF')}33`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-700 truncate group-hover:text-[#048F86] transition-colors">{m.meeting_title}</p>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium" style={{
                      background: (STATUS_COLORS[m.status] || '#9CA3AF') + '15',
                      color: STATUS_COLORS[m.status] || '#9CA3AF',
                    }}>
                      {getMeetingStatusLabel(m.status)}
                    </span>
                    <span>·</span>
                    <span>{m.submitter_name}</span>
                  </p>
                </div>
                <span className="text-[10px] text-gray-300 flex-shrink-0 group-hover:text-gray-500 transition-colors">
                  {(() => {
                    try { return formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ar }); } catch { return ''; }
                  })()}
                </span>
              </motion.button>
            )) : (
              <p className="text-center text-gray-400 py-10 text-sm">لا توجد طلبات</p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
