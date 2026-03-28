import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Clock, CheckCircle2, FileText, Volume2, AlertTriangle, Zap } from 'lucide-react';
import { listDirectives, type MinisterDirective } from '../api/directivesApi';
import { CreateDirectiveModal } from '../components/CreateDirectiveModal';
import { VoicePlayer } from '../components/VoicePlayer';
import { Pagination } from '@/modules/shared/components/pagination';
import { format } from 'date-fns';

type FilterTab = 'ALL' | 'GENERAL' | 'GOVERNMENT_CENTER' | 'EXECUTIVE_OFFICE';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: 'الكل' },
  { id: 'GENERAL', label: 'عام' },
  { id: 'GOVERNMENT_CENTER', label: 'مركز الحكومة' },
  { id: 'EXECUTIVE_OFFICE', label: 'المكتب التنفيذي' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  OPEN: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  CLOSED: { label: 'مكتمل', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  TAKEN: { label: 'تم الاخذ بالتوجيه', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  ADOPTED: { label: 'تم اعتماد التوجيه', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL: 'عام',
  GOVERNMENT_CENTER: 'مركز الحكومة',
  EXECUTIVE_OFFICE: 'المكتب التنفيذي',
};

const DURATION_LABELS: Record<string, string> = {
  HOUR: 'ساعة', HOURS: 'ساعة',
  DAY: 'يوم', DAYS: 'يوم',
  WEEK: 'أسبوع', WEEKS: 'أسبوع',
  MONTH: 'شهر', MONTHS: 'شهر',
};

const PAGE_SIZE = 10;

function DirectiveCard({ directive }: { directive: MinisterDirective }) {
  const statusInfo = STATUS_CONFIG[directive.scheduling_officer_status] || STATUS_CONFIG['OPEN'];
  const isCompleted = directive.scheduling_officer_status === 'CLOSED';
  const hasVoice = !!directive.voice_play_url;
  const isUrgent = directive.priority === 'URGENT';
  const isImportant = directive.importance === 'IMPORTANT';

  return (
    <div className="group bg-card border border-border/40 rounded-xl transition-all hover:shadow-sm hover:border-border/70 overflow-hidden">
      {/* Urgent top accent */}
      {isUrgent && <div className="h-[2px] bg-gradient-to-l from-red-500 to-red-400" />}

      <div className="px-5 py-4">
        {/* Row 1: Status icon + Title + Date + Status badge */}
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
            isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-muted/60 text-muted-foreground'
          }`}>
            {isCompleted ? <CheckCircle2 className="size-[18px]" /> : <Clock className="size-[18px]" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-[14px] font-semibold text-foreground leading-relaxed line-clamp-2 flex-1">
                {directive.title}
              </h3>
              <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-medium ${statusInfo.color}`}>
                <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {format(new Date(directive.created_at), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Voice player */}
        {hasVoice && (
          <div className="mt-3 mr-12 rounded-lg bg-muted/30 px-3 py-2">
            <VoicePlayer url={directive.voice_play_url!} compact />
          </div>
        )}

        {/* Tags */}
        <div className="mt-3 mr-12 flex flex-wrap items-center gap-1.5">
          {directive.directive_type && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <FileText className="size-3" />
              {TYPE_LABELS[directive.directive_type] || directive.directive_type}
            </span>
          )}
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600">
              <AlertTriangle className="size-3" />
              عاجل
            </span>
          )}
          {isImportant && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <Zap className="size-3" />
              مهم
            </span>
          )}
          {directive.due_duration_enabled && directive.due_duration_value && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              {directive.due_duration_value} {DURATION_LABELS[directive.due_duration_unit || 'HOURS'] || 'ساعة'}
            </span>
          )}
          {hasVoice && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-0.5 text-[10px] text-primary font-medium">
              <Volume2 className="size-3" />
              صوتي
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DirectivesListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['uc19-directives', currentPage],
    queryFn: () => listDirectives({ limit: PAGE_SIZE, skip: (currentPage - 1) * PAGE_SIZE }),
  });

  const directives = data?.items || [];
  const total = data?.total || 0;

  const filteredDirectives = activeFilter === 'ALL'
    ? directives
    : directives.filter((d) => d.directive_type === activeFilter);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5 px-4 sm:px-6 py-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">التوجيهات</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{total} توجيه</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
        >
          <Plus className="size-4" />
          إنشاء توجيه
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-all ${
              activeFilter === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border/20 bg-card p-5">
              <div className="flex gap-3">
                <div className="size-9 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="h-3 w-1/4 rounded bg-muted" />
                  <div className="flex gap-2 mt-1">
                    <div className="h-5 w-14 rounded bg-muted" />
                    <div className="h-5 w-12 rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : filteredDirectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            <p className="text-[14px] font-medium text-foreground mb-1">لا توجد توجيهات</p>
            <p className="text-[12px] text-muted-foreground">ستظهر التوجيهات هنا عند إنشائها</p>
          </div>
        ) : (
          filteredDirectives.map((directive) => (
            <DirectiveCard key={directive.id} directive={directive} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-2 pb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <CreateDirectiveModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
