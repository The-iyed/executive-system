/**
 * Shared MeetingInfoView – production-ready read-only meeting info display.
 * Modern, clean, minimal UI with proper RTL support.
 */
import { cn } from '@/lib/ui';
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

function FieldCell({ label, value, fullWidth }: MeetingInfoField & { fullWidth?: boolean }) {
  const isLink = typeof value === 'string' && value.startsWith('http');
  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'sm:col-span-2')}>
      <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
      <div className={cn(
        'w-full px-4 flex items-center rounded-xl border border-border/50 bg-muted/30 transition-colors',
        fullWidth ? 'min-h-[72px] items-start py-3' : 'min-h-[44px] py-2',
      )}>
        {isLink ? (
          <a
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline break-all text-left"
            dir="ltr"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm font-medium text-foreground whitespace-pre-wrap">{value ?? '—'}</span>
        )}
      </div>
    </div>
  );
}

function AgendaTable({ items }: { items: AgendaItem[] }) {
  if (!items.length) {
    return (
      <div className="w-full min-h-[44px] flex items-center px-4 py-2 border border-border/50 rounded-xl bg-muted/30 text-sm text-muted-foreground">
        لا توجد بنود محددة
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-border/50 rounded-xl bg-muted/10">
      <table className="w-full text-sm text-right">
        <thead>
          <tr className="border-b border-border/50 bg-muted/40">
            <th className="px-4 py-3 text-muted-foreground font-semibold whitespace-nowrap w-16 text-center">#</th>
            <th className="px-4 py-3 text-muted-foreground font-semibold">الأجندة</th>
            <th className="px-4 py-3 text-muted-foreground font-semibold whitespace-nowrap w-[180px] text-center">الدعم المطلوب من الوزير</th>
            <th className="px-4 py-3 text-muted-foreground font-semibold whitespace-nowrap w-[140px] text-center">مدة العرض</th>
            <th className="px-4 py-3 text-muted-foreground font-semibold">نص الدعم (أخرى)</th>
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
              <td className="px-4 py-3 text-foreground">{item.minister_support_other ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MeetingInfoView({ data, className }: MeetingInfoViewProps) {
  return (
    <div className={cn('w-full flex flex-col gap-8 max-w-[1200px] mx-auto', className)} dir="rtl">
      {data.sections.map((section, sIdx) => (
        <div key={sIdx} className="flex flex-col gap-5">
          {section.title && (
            <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {section.fields.map(field => (
              <FieldCell key={field.key} {...field} />
            ))}
          </div>
        </div>
      ))}

      {/* Agenda */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground">أجندة الاجتماع</h3>
        <AgendaTable items={data.agenda ?? []} />
      </div>
    </div>
  );
}
