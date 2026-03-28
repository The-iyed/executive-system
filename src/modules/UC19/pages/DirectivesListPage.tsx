import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ClipboardList, Clock, CheckCircle2, Mic, FileText } from 'lucide-react';
import { listDirectives, type MinisterDirective } from '../api/directivesApi';
import { CreateDirectiveModal } from '../components/CreateDirectiveModal';
import { format } from 'date-fns';

type FilterTab = 'ALL' | 'SCHEDULING' | 'GENERAL' | 'GOVERNMENT_CENTER' | 'EXECUTIVE_OFFICE';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: 'الكل' },
  { id: 'GENERAL', label: 'عام' },
  { id: 'GOVERNMENT_CENTER', label: 'مركز الحكومة' },
  { id: 'EXECUTIVE_OFFICE', label: 'المكتب التنفيذي' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  CLOSED: { label: 'مكتمل', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TAKEN: { label: 'تم الاخذ بالتوجيه', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ADOPTED: { label: 'تم اعتماد التوجيه', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const IMPORTANCE_LABELS: Record<string, { label: string; color: string }> = {
  IMPORTANT: { label: 'مهم', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  NORMAL: { label: 'عادي', color: 'bg-muted text-muted-foreground border-border/50' },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'عاجل', color: 'bg-red-50 text-red-600 border-red-200' },
  NORMAL: { label: 'عادي', color: 'bg-muted text-muted-foreground border-border/50' },
};

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  SCHEDULING: { label: 'جدولة', icon: '📅' },
  GENERAL: { label: 'عام', icon: '📄' },
  GOVERNMENT_CENTER: { label: 'مركز الحكومة', icon: '🏛️' },
  EXECUTIVE_OFFICE: { label: 'المكتب التنفيذي', icon: '🏢' },
};

function DirectiveCard({ directive }: { directive: MinisterDirective }) {
  const statusInfo = STATUS_LABELS[directive.scheduling_officer_status] || STATUS_LABELS['OPEN'];
  const importanceInfo = directive.importance ? IMPORTANCE_LABELS[directive.importance] : null;
  const priorityInfo = directive.priority ? PRIORITY_LABELS[directive.priority] : null;
  const typeInfo = directive.directive_type ? TYPE_LABELS[directive.directive_type] : null;
  const hasVoice = !!directive.voice_note_path;
  const isCompleted = directive.scheduling_officer_status === 'CLOSED';

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

      {/* Voice note indicator */}
      {hasVoice && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
          <button className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <svg className="size-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </button>
          <div className="flex-1 h-1 rounded-full bg-border/60 overflow-hidden">
            <div className="h-full w-0 rounded-full bg-primary" />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Mic className="size-3" />
            ملاحظة صوتية
          </div>
        </div>
      )}

      {/* Tags row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {typeInfo && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
            <FileText className="size-3" />
            {typeInfo.label}
          </span>
        )}
        {priorityInfo && priorityInfo.label !== 'عادي' && (
          <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-bold ${priorityInfo.color}`}>
            {priorityInfo.label}
          </span>
        )}
        {importanceInfo && importanceInfo.label !== 'عادي' && (
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${importanceInfo.color}`}>
            ⚡ {importanceInfo.label}
          </span>
        )}
        {directive.due_duration_enabled && directive.due_duration_value && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            {directive.due_duration_value} {directive.due_duration_unit === 'HOURS' ? 'ساعة' : directive.due_duration_unit === 'DAYS' ? 'يوم' : directive.due_duration_unit === 'WEEKS' ? 'أسبوع' : 'شهر'}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground mr-auto">
          {format(new Date(directive.created_at), 'dd MMM yyyy')}
        </span>
        <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-medium ${statusInfo.color}`}>
          ● {statusInfo.label}
        </span>
      </div>
    </div>
  );
}

export default function DirectivesListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  const { data: directives = [], isLoading } = useQuery({
    queryKey: ['uc19-directives'],
    queryFn: () => listDirectives({ limit: 200 }),
  });

  const filteredDirectives = activeFilter === 'ALL'
    ? directives
    : directives.filter((d) => d.directive_type === activeFilter);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-2 py-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">التوجيهات الوزارية</h1>
            <p className="text-[11px] text-muted-foreground">
              {directives.length} توجيه
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

      <CreateDirectiveModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
