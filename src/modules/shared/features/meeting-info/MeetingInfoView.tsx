/**
 * Shared MeetingInfoView – production-ready read-only meeting info display.
 * Modern, clean, minimal UI with proper RTL support.
 */
import { cn } from '@/lib/ui';
import { Info, ExternalLink } from 'lucide-react';
import type { MeetingInfoViewProps, MeetingInfoField, AgendaItem } from './types';

/* ─── Duration / Minister support labels ─── */
const DURATION_LABELS: Record<string, string> = {
  '5': '5 دقائق', '10': '10 دقائق', '15': '15 دقيقة', '20': '20 دقيقة',
  '25': '25 دقيقة', '30': '30 دقيقة', '45': '45 دقيقة', '60': '60 دقيقة',
  '90': '90 دقيقة', '120': '120 دقيقة', '180': '180 دقيقة',
};
const MINISTER_SUPPORT_LABELS: Record<string, string> = {
  'إحاطة': 'إحاطة', 'تحديث': 'تحديث', 'قرار': 'قرار',
  'توجيه': 'توجيه', 'اعتماد': 'اعتماد', 'أخرى': 'أخرى (يقوم بالإدخال)',
};

function isEmptyValue(value: React.ReactNode): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value === '—' || value.trim() === '';
  return false;
}

function LinkField({ value }: { value: string }) {
  return (
    <div className="sm:col-span-2 flex flex-col gap-1.5">
      <p className="text-[13px] font-semibold text-muted-foreground">رابط الاجتماع (Webex)</p>
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
        dir="ltr"
      >
        <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-primary truncate flex-1 text-left">{value}</span>
      </a>
    </div>
  );
}

function FieldCell({ label, value, fullWidth, alwaysShow }: MeetingInfoField & { fullWidth?: boolean; alwaysShow?: boolean }) {
  if (!alwaysShow && isEmptyValue(value)) return null;

  const isLink = typeof value === 'string' && value.startsWith('http');
  if (isLink) return <LinkField value={value as string} />;

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'sm:col-span-2')} dir="rtl">
      <p className="text-sm text-muted-foreground text-right">{label}</p>
      <div className={cn(
        'flex items-center gap-2.5 px-4 py-3 rounded-2xl border bg-muted/40 border-border/40',
        fullWidth && 'min-h-[72px] items-start',
      )}>
        <span className="flex-1 text-sm font-medium text-foreground text-right whitespace-pre-wrap">{value ?? '—'}</span>
      </div>
    </div>
  );
}

function AgendaTable({ items }: { items: AgendaItem[] }) {
  if (!items.length) return null;

  const hasOtherText = items.some(i => i.minister_support_other && i.minister_support_other.trim() !== '');

  return (
    <div className="w-full overflow-x-auto border border-border/50 rounded-xl bg-muted/10">
      <table className="w-full text-sm text-right">
        <thead>
          <tr className="border-b border-border/50 bg-muted/40">
            <th className="px-4 py-3 text-muted-foreground font-semibold whitespace-nowrap w-16 text-center">#</th>
            <th className="px-4 py-3 text-muted-foreground font-semibold">الأجندة</th>
            <th className="px-4 py-3 text-muted-foreground font-semibold whitespace-nowrap w-[180px] text-center">الدعم المطلوب من الوزير</th>
            <th className="px-4 py-3 text-muted-foreground font-semibold whitespace-nowrap w-[140px] text-center">مدة العرض</th>
            {hasOtherText && <th className="px-4 py-3 text-muted-foreground font-semibold">نص الدعم (أخرى)</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id ?? idx} className={idx < items.length - 1 ? 'border-b border-border/30' : ''}>
              <td className="px-4 py-3 text-muted-foreground text-center">{idx + 1}</td>
              <td className="px-4 py-3 text-foreground">{item.agenda_item ?? '-'}</td>
              <td className="px-4 py-3 text-muted-foreground text-center">
                {MINISTER_SUPPORT_LABELS[item.minister_support_type ?? ''] ?? item.minister_support_type ?? '-'}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-center">
                {DURATION_LABELS[String(item.presentation_duration_minutes ?? '')] ?? (item.presentation_duration_minutes ? `${item.presentation_duration_minutes} دقيقة` : '-')}
              </td>
              {hasOtherText && <td className="px-4 py-3 text-foreground">{item.minister_support_other ?? '-'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MeetingInfoView({
  data,
  className,
  title = 'معلومات الاجتماع',
  description = 'تفاصيل ومعلومات الاجتماع الأساسية',
}: MeetingInfoViewProps) {
  return (
    <div className={cn('w-full flex flex-col gap-6 max-w-4xl mx-auto pb-16', className)} dir="rtl">
      {/* Header with icon + title + description */}
      <div className="flex items-start justify-end gap-3" dir="ltr">
        <div className="text-right">
          <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
          <Info className="w-4 h-4" />
        </div>
      </div>

      {/* First section (basic info) */}
      {data.sections[0] && (() => {
        const visibleFields = data.sections[0].fields.filter(f => f.alwaysShow || !isEmptyValue(f.value));
        return visibleFields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {visibleFields.map(field => (
              <FieldCell key={field.key} {...field} />
            ))}
          </div>
        ) : null;
      })()}

      {/* Agenda — between basic info and directive fields */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground">أجندة الاجتماع</h3>
        {data.agenda && data.agenda.length > 0 ? (
          <AgendaTable items={data.agenda} />
        ) : (
          <div className="px-4 py-3 rounded-2xl border bg-muted/40 border-border/40 text-sm text-muted-foreground text-right">
            لا توجد أجندة
          </div>
        )}
      </div>

      {/* Remaining sections (directive, etc.) — no titles */}
      {data.sections.slice(1).map((section, sIdx) => {
        const visibleFields = section.fields.filter(f => f.alwaysShow || !isEmptyValue(f.value));
        if (!visibleFields.length) return null;
        return (
          <div key={sIdx + 1} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {visibleFields.map(field => (
              <FieldCell key={field.key} {...field} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
