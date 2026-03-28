import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Save, ChevronDown } from 'lucide-react';
import {
  createDirective,
  type CreateDirectivePayload,
  type DirectiveType,
  type ImportanceLevel,
  type PriorityLevel,
  type DurationUnit,
} from '../api/directivesApi';

interface CreateDirectiveModalProps {
  open: boolean;
  onClose: () => void;
}

const DIRECTIVE_TYPES: { value: DirectiveType; label: string }[] = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'EXECUTIVE_OFFICE', label: 'المكتب التنفيذي' },
  { value: 'GOVERNMENT_CENTER', label: 'مركز الحكومة' },
];

const IMPORTANCE_OPTIONS: { value: ImportanceLevel; label: string }[] = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'IMPORTANT', label: 'مهم' },
];

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string }[] = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'URGENT', label: 'عاجل' },
];

const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'HOURS', label: 'ساعة' },
  { value: 'DAYS', label: 'يوم' },
  { value: 'WEEKS', label: 'أسبوع' },
  { value: 'MONTHS', label: 'شهر' },
];

export function CreateDirectiveModal({ open, onClose }: CreateDirectiveModalProps) {
  const qc = useQueryClient();

  const [directiveType, setDirectiveType] = useState<DirectiveType>('GENERAL');
  const [title, setTitle] = useState('');
  const [importance, setImportance] = useState<ImportanceLevel>('NORMAL');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [dueDurationEnabled, setDueDurationEnabled] = useState(false);
  const [dueDurationValue, setDueDurationValue] = useState(1);
  const [dueDurationUnit, setDueDurationUnit] = useState<DurationUnit>('HOURS');

  const resetForm = () => {
    setDirectiveType('GENERAL');
    setTitle('');
    setImportance('NORMAL');
    setPriority('NORMAL');
    setDueDurationEnabled(false);
    setDueDurationValue(1);
    setDueDurationUnit('HOURS');
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateDirectivePayload) => createDirective(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['uc19-directives'] });
      resetForm();
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    const payload: CreateDirectivePayload = {
      title: title.trim(),
      status: 'TAKEN',
      scheduling_officer_status: 'OPEN',
      directive_type: directiveType,
      importance,
      priority,
      due_duration_enabled: dueDurationEnabled,
    };
    if (dueDurationEnabled) {
      payload.due_duration_value = dueDurationValue;
      payload.due_duration_unit = dueDurationUnit;
    }
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30">
          <h2 className="text-[16px] font-bold text-foreground">بيانات التوجيه</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Directive Type */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-2">
              نوع التوجيه <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                value={directiveType}
                onChange={(e) => setDirectiveType(e.target.value as DirectiveType)}
                className="w-full appearance-none rounded-xl border border-border/50 bg-background px-4 py-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
              >
                {DIRECTIVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Directive Text */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-2">
              التوجيه <span className="text-destructive">*</span>
            </label>
            <div className="rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اكتب التوجيه هنا، أو استخدم الإدخال الصوتي..."
                rows={4}
                className="w-full bg-transparent px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
              />
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/20">
                <span className="text-[11px] text-muted-foreground">أو سجّل توجيهك صوتياً</span>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  تسجيل صوتي
                </button>
              </div>
            </div>
          </div>

          {/* Importance & Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-2">
                الأهمية <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
                  className="w-full appearance-none rounded-xl border border-border/50 bg-background px-4 py-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                >
                  {IMPORTANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-foreground mb-2">
                الأولوية <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full appearance-none rounded-xl border border-border/50 bg-background px-4 py-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Due Duration */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-2">مدة الاستحقاق</label>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-foreground">تفعيل مدة الاستحقاق</p>
                  <p className="text-[11px] text-muted-foreground">عند التفعيل يمكن تحديد الوحدة والقيمة.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dueDurationEnabled}
                  onClick={() => setDueDurationEnabled(!dueDurationEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    dueDurationEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      dueDurationEnabled ? '-translate-x-[1.375rem]' : '-translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {dueDurationEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">القيمة</label>
                    <input
                      type="number"
                      min={1}
                      value={dueDurationValue}
                      onChange={(e) => setDueDurationValue(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">الوحدة</label>
                    <div className="relative">
                      <select
                        value={dueDurationUnit}
                        onChange={(e) => setDueDurationUnit(e.target.value as DurationUnit)}
                        className="w-full appearance-none rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                      >
                        {DURATION_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {mutation.isError && (
            <p className="text-[11px] text-destructive">
              حدث خطأ أثناء الإنشاء، يرجى المحاولة مرة أخرى
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border/30 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || mutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            حفظ التوجيه
          </button>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-xl border border-border/50 bg-card px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
