import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Clock, CheckCircle2, FileText, Volume2, AlertTriangle, Zap, Copy, Check, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import {
  listDirectives,
  type MinisterDirective,
  type DirectiveType,
  type ImportanceLevel,
  type PriorityLevel,
  type DirectiveStatus,
  type SchedulingOfficerStatus,
} from '../api/directivesApi';
import { CreateDirectiveModal } from '../components/CreateDirectiveModal';
import { VoicePlayer } from '../components/VoicePlayer';
import { Pagination } from '@/modules/shared/components/pagination';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  OPEN: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  CLOSED: { label: 'مكتمل', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  TAKEN: { label: 'تم الأخذ بالتوجيه', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  ADOPTED: { label: 'تم اعتماد التوجيه', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL: 'عام',
  GOVERNMENT_CENTER: 'مركز الحكومة',
  EXECUTIVE_OFFICE: 'المكتب التنفيذي',
};

const IMPORTANCE_LABELS: Record<string, string> = {
  VERY_IMPORTANT: 'مهم جداً',
  IMPORTANT: 'مهم',
  NORMAL: 'عادي',
};

const PRIORITY_LABELS: Record<string, string> = {
  VERY_URGENT: 'عاجل جداً',
  URGENT: 'عاجل',
  NORMAL: 'عادي',
};

const DURATION_LABELS: Record<string, string> = {
  HOUR: 'ساعة',
  DAY: 'يوم',
};

// Filter options for dropdowns
const TYPE_FILTER_OPTIONS: { value: DirectiveType; label: string }[] = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'GOVERNMENT_CENTER', label: 'مركز الحكومة' },
  { value: 'EXECUTIVE_OFFICE', label: 'المكتب التنفيذي' },
];

const IMPORTANCE_FILTER_OPTIONS: { value: ImportanceLevel; label: string }[] = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'IMPORTANT', label: 'مهم' },
  { value: 'VERY_IMPORTANT', label: 'مهم جداً' },
];

const PRIORITY_FILTER_OPTIONS: { value: PriorityLevel; label: string }[] = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'URGENT', label: 'عاجل' },
  { value: 'VERY_URGENT', label: 'عاجل جداً' },
];

const STATUS_FILTER_OPTIONS: { value: DirectiveStatus; label: string }[] = [
  { value: 'TAKEN', label: 'تم الأخذ بالتوجيه' },
  { value: 'ADOPTED', label: 'تم اعتماد التوجيه' },
];

const OFFICER_STATUS_FILTER_OPTIONS: { value: SchedulingOfficerStatus; label: string }[] = [
  { value: 'OPEN', label: 'قيد الانتظار' },
  { value: 'CLOSED', label: 'مكتمل' },
];

const PAGE_SIZE = 10;

interface Filters {
  directive_type?: DirectiveType;
  importance?: ImportanceLevel;
  priority?: PriorityLevel;
  status?: DirectiveStatus;
  scheduling_officer_status?: SchedulingOfficerStatus;
}

function DirectiveCard({ directive }: { directive: MinisterDirective }) {
  const [copied, setCopied] = useState(false);
  const statusInfo = STATUS_CONFIG[directive.scheduling_officer_status] || STATUS_CONFIG['OPEN'];
  const isCompleted = directive.scheduling_officer_status === 'CLOSED';
  const hasVoice = !!directive.voice_play_url;
  const isUrgent = directive.priority === 'URGENT' || directive.priority === 'VERY_URGENT';
  const isImportant = directive.importance === 'IMPORTANT' || directive.importance === 'VERY_IMPORTANT';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(directive.title);
    setCopied(true);
    toast.success('تم النسخ');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-card border border-border/40 rounded-xl transition-all hover:shadow-sm hover:border-border/70 overflow-hidden">
      

      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
            isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-muted/60 text-muted-foreground'
          }`}>
            {isCompleted ? <CheckCircle2 className="size-[18px]" /> : <Clock className="size-[18px]" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[14px] font-semibold text-foreground leading-relaxed line-clamp-2 flex-1">
                {directive.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors opacity-0 group-hover:opacity-100"
                  title="نسخ المحتوى"
                >
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-medium ${statusInfo.color}`}>
                  <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {format(new Date(directive.created_at), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {hasVoice && (
          <div className="mt-3 mr-12 rounded-lg bg-muted/30 px-3 py-2">
            <VoicePlayer url={directive.voice_play_url!} compact />
          </div>
        )}

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
              {directive.priority === 'VERY_URGENT' ? 'عاجل جداً' : 'عاجل'}
            </span>
          )}
          {isImportant && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <Zap className="size-3" />
              {directive.importance === 'VERY_IMPORTANT' ? 'مهم جداً' : 'مهم'}
            </span>
          )}
          {directive.due_duration_enabled && directive.due_duration_value && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              {directive.due_duration_value} {DURATION_LABELS[directive.due_duration_unit || 'DAY'] || 'يوم'}
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

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (val: T | undefined) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? (e.target.value as T) : undefined)}
        className={`appearance-none rounded-lg border border-border/50 bg-background px-3 py-1.5 text-[11px] outline-none transition-colors cursor-pointer pe-7 ${
          value ? 'text-foreground font-medium border-primary/40' : 'text-muted-foreground'
        }`}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function DirectivesListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeType, setActiveType] = useState<DirectiveType | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['uc19-directives', currentPage, activeType],
    queryFn: () => listDirectives({
      limit: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      directive_type: activeType,
    }),
  });

  const directives = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTypeChange = (type: DirectiveType | undefined) => {
    setActiveType(type);
    setCurrentPage(1);
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

      {/* Type tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-0">
        {[
          { value: undefined, label: 'الكل' },
          ...TYPE_FILTER_OPTIONS,
        ].map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => handleTypeChange(tab.value as DirectiveType | undefined)}
            className={`relative px-4 py-2 text-[13px] font-medium transition-colors rounded-t-lg ${
              activeType === tab.value
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {activeType === tab.value && (
              <span className="absolute bottom-0 inset-x-1 h-[2px] bg-primary rounded-full" />
            )}
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
        ) : directives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            <p className="text-[14px] font-medium text-foreground mb-1">لا توجد توجيهات</p>
            <p className="text-[12px] text-muted-foreground">ستظهر التوجيهات هنا عند إنشائها</p>
          </div>
        ) : (
          directives.map((directive) => (
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
