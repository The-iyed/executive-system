import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { Icon } from '@iconify/react';
import { getAssignedSchedulingRequests } from '../data/meetingsApi';
import { getDirectivesPaginated, DirectiveApiResponse } from '../data/directivesApi';
import { getWaitingList } from '../data/meetingsApi';
import { MeetingStatus, getMeetingStatusLabel } from '@/modules/shared';
import { PATH } from '../routes/paths';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Stat card ──────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  bgColor: string;
  subtitle?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgColor, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-right transition-shadow hover:shadow-md w-full"
    dir="rtl"
  >
    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: bgColor }}>
      <Icon icon={icon} width={24} height={24} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] text-[hsl(var(--muted-foreground))]">{title}</p>
      <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-0.5">{value}</p>
      {subtitle && <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">{subtitle}</p>}
    </div>
  </button>
);

// ── Colors ─────────────────────────────────────────────
const CHART_COLORS = ['#048F86', '#3C6FD1', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#EC4899', '#6366F1'];

const STATUS_COLORS: Record<string, string> = {
  [MeetingStatus.UNDER_REVIEW]: '#3C6FD1',
  [MeetingStatus.SCHEDULED]: '#10B981',
  [MeetingStatus.WAITING]: '#F59E0B',
  [MeetingStatus.REJECTED]: '#EF4444',
  [MeetingStatus.CANCELLED]: '#9CA3AF',
  [MeetingStatus.CLOSED]: '#6366F1',
  [MeetingStatus.UNDER_GUIDANCE]: '#8B5CF6',
  [MeetingStatus.UNDER_CONTENT_REVIEW]: '#EC4899',
};

// ── Dashboard ──────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ['dashboard-meetings'],
    queryFn: () => getAssignedSchedulingRequests({ limit: 200 }),
    staleTime: 30_000,
  });

  const { data: directives, isLoading: directivesLoading } = useQuery({
    queryKey: ['dashboard-directives'],
    queryFn: () => getDirectivesPaginated({ limit: 200 }),
    staleTime: 30_000,
  });

  const { data: waitingList, isLoading: waitingLoading } = useQuery({
    queryKey: ['dashboard-waiting'],
    queryFn: () => getWaitingList({ limit: 200 }),
    staleTime: 30_000,
  });

  const isLoading = meetingsLoading || directivesLoading || waitingLoading;
  const meetingItems = meetings?.items ?? [];
  const directiveItems = directives?.items ?? [];
  const waitingItems = waitingList?.items ?? [];

  // ── Computed stats ───────────────────────────────
  const totalMeetings = meetings?.total ?? meetingItems.length;
  const totalDirectives = directives?.total ?? directiveItems.length;
  const totalWaiting = waitingList?.total ?? waitingItems.length;

  const underReviewCount = meetingItems.filter(m => m.status === MeetingStatus.UNDER_REVIEW).length;
  const scheduledCount = meetingItems.filter(m =>
    m.status === MeetingStatus.SCHEDULED ||
    m.status === MeetingStatus.SCHEDULED_SCHEDULING ||
    m.status === MeetingStatus.SCHEDULED_CONTENT
  ).length;

  const openDirectives = directiveItems.filter(d => d.directive_status !== 'CLOSED' && d.directive_status !== 'COMPLETED').length;

  // ── Status distribution for pie chart ────────────
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

  // ── Meetings by month (area chart) ──────────────
  const monthlyData = React.useMemo(() => {
    const months: Record<string, number> = {};
    meetingItems.forEach(m => {
      const d = m.submitted_at || m.created_at;
      if (!d) return;
      const date = new Date(d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => {
        const [y, m] = month.split('-');
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return { name: monthNames[parseInt(m) - 1] || month, count };
      });
  }, [meetingItems]);

  // ── Directive status bar chart ──────────────────
  const directiveStatusData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    directiveItems.forEach(d => {
      const s = d.directive_status || 'غير محدد';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status === 'OPEN' ? 'مفتوح' : status === 'CLOSED' ? 'مغلق' : status === 'IN_PROGRESS' ? 'جاري' : status === 'COMPLETED' ? 'مكتمل' : status,
      count,
    }));
  }, [directiveItems]);

  // ── Recent meetings ────────────────────────────
  const recentMeetings = [...meetingItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">لوحة المعلومات</h1>
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-1">نظرة عامة على الاجتماعات والتوجيهات وسير العمل</p>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الطلبات"
          value={totalMeetings}
          icon="solar:folder-with-files-bold"
          color="#048F86"
          bgColor="rgba(4,143,134,0.1)"
          subtitle={`${underReviewCount} قيد المراجعة`}
          onClick={() => navigate(PATH.WORK_BASKET)}
        />
        <StatCard
          title="الاجتماعات المجدولة"
          value={scheduledCount}
          icon="solar:calendar-mark-bold"
          color="#3C6FD1"
          bgColor="rgba(60,111,209,0.1)"
          onClick={() => navigate(PATH.SCHEDULED_MEETINGS)}
        />
        <StatCard
          title="التوجيهات"
          value={totalDirectives}
          icon="solar:document-text-bold"
          color="#8B5CF6"
          bgColor="rgba(139,92,246,0.1)"
          subtitle={`${openDirectives} مفتوحة`}
          onClick={() => navigate(PATH.DIRECTIVES)}
        />
        <StatCard
          title="قائمة الانتظار"
          value={totalWaiting}
          icon="solar:clock-circle-bold"
          color="#F59E0B"
          bgColor="rgba(245,158,11,0.1)"
          onClick={() => navigate(PATH.WAITING_LIST)}
        />
      </div>

      {/* ── Charts row ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status distribution pie */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h3 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-4">توزيع حالات الطلبات</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.08)', fontSize: 13 }}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, lineHeight: '22px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[hsl(var(--muted-foreground))] py-10 text-sm">لا توجد بيانات</p>
          )}
        </div>

        {/* Monthly trend area */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h3 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-4">الطلبات حسب الشهر</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#048F86" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#048F86" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.08)', fontSize: 13 }} />
                <Area type="monotone" dataKey="count" stroke="#048F86" strokeWidth={2.5} fill="url(#colorMeetings)" name="الطلبات" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[hsl(var(--muted-foreground))] py-10 text-sm">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* ── Second row: directives bar + recent meetings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Directive status bar chart */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h3 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-4">حالات التوجيهات</h3>
          {directiveStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={directiveStatusData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.08)', fontSize: 13 }} />
                <Bar dataKey="count" name="العدد" radius={[8, 8, 0, 0]}>
                  {directiveStatusData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[hsl(var(--muted-foreground))] py-10 text-sm">لا توجد بيانات</p>
          )}
        </div>

        {/* Recent meetings list */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h3 className="text-[15px] font-semibold text-[hsl(var(--foreground))] mb-4">أحدث الطلبات</h3>
          <div className="flex flex-col gap-3">
            {recentMeetings.length > 0 ? recentMeetings.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/meeting/${m.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors text-right w-full"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: STATUS_COLORS[m.status] || '#9CA3AF' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[hsl(var(--foreground))] truncate">{m.meeting_title}</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    {getMeetingStatusLabel(m.status)} · {m.submitter_name}
                  </p>
                </div>
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] flex-shrink-0">
                  {(() => {
                    try {
                      return formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ar });
                    } catch { return ''; }
                  })()}
                </span>
              </button>
            )) : (
              <p className="text-center text-[hsl(var(--muted-foreground))] py-6 text-sm">لا توجد طلبات</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
