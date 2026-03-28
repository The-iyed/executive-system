import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Clock, CheckCircle2, FileText, Volume2, AlertTriangle, Zap, ClipboardList } from 'lucide-react';
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
    <div className="group rounded-2xl border border-border/40 bg-card px-5 py-4 transition-all hover:shadow-md hover:border-border/60">
      <div className="flex items-start justify-between gap-3">
        {/* Right: Icon + Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
            {isCompleted ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-foreground leading-relaxed line-clamp-2">
              {directive.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Voice player */}
      {hasVoice && (
        <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2.5">
          <VoicePlayer url={directive.voice_play_url!} compact />
        </div>
      )}

      {/* Tags row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {directive.directive_type && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
            <FileText className="size-3" />
            {TYPE_LABELS[directive.directive_type] || directive.directive_type}
          </span>
        )}
        {isUrgent && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
            <AlertTriangle className="size-3" />
            عاجل
          </span>
        )}
        {isImportant && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
            <Zap className="size-3" />
            مهم
          </span>
        )}
        {directive.due_duration_enabled && directive.due_duration_value && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            {directive.due_duration_value} {DURATION_LABELS[directive.due_duration_unit || 'HOURS'] || 'ساعة'}
          </span>
        )}
        {hasVoice && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/5 px-2 py-1 text-[10px] text-primary">
            <Volume2 className="size-3" />
            صوتي
          </span>
        )}
        <span className="text-[10px] text-muted-foreground mr-auto">
          {format(new Date(directive.created_at), 'dd MMM yyyy')}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-medium ${statusInfo.color}`}>
          <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
          {statusInfo.label}
        </span>
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
    <div className="mx-auto max-w-[1200px] space-y-5 px-2 py-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">التوجيهات</h1>
            <p className="text-[11px] text-muted-foreground">
              {total} توجيه
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
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
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all ${
              activeFilter === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border/30 bg-card p-5 h-24" />
            ))}
          </div>
        ) : filteredDirectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mb-4">
              <ClipboardList className="size-7 text-muted-foreground" />
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
        <div className="mt-6 pb-4">
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
