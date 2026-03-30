/**
 * Shared MeetingInfoView – production-ready read-only meeting info display.
 * All fields always visible with "—" fallback for missing data.
 */
import { cn } from '@/lib/ui';
import { Info, Copy, MapPin, Building2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
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
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success('تم نسخ الرابط');
  };

  // Extract a friendly domain label from the URL
  let domainLabel = 'رابط الاجتماع';
  try {
    const host = new URL(value).hostname.replace('www.', '');
    if (host.includes('webex')) domainLabel = 'Webex Meeting';
    else if (host.includes('zoom')) domainLabel = 'Zoom Meeting';
    else if (host.includes('teams')) domainLabel = 'Microsoft Teams';
    else domainLabel = host;
  } catch { /* keep default */ }

  return (
    <div className="sm:col-span-2 flex flex-col gap-1.5" dir="rtl">
      <p className="text-sm text-muted-foreground text-right">رابط الاجتماع</p>
      <div className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border bg-muted/40 border-border/40">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate" title={value}>
            {domainLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="نسخ الرابط"
          >
            <Copy className="w-3.5 h-3.5" />
            نسخ
          </button>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            title="الانضمام للاجتماع"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            انضمام
          </a>
        </div>
      </div>
    </div>
  );
}

/* Icon lookup for specific field keys */
const FIELD_ICONS: Record<string, React.ReactNode> = {
  meeting_owner: <Building2 className="w-4 h-4" />,
};

function FieldCell({ label, value, fullWidth, icon, fieldKey }: MeetingInfoField & { fullWidth?: boolean; fieldKey?: string }) {
  const displayValue = isEmptyValue(value) ? '—' : value;

  const isLink = typeof value === 'string' && value.startsWith('http');
  if (isLink) return <LinkField value={value as string} />;

  const resolvedIcon = icon ?? (fieldKey ? FIELD_ICONS[fieldKey] : undefined);

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'sm:col-span-2')} dir="rtl">
      <p className="text-sm text-muted-foreground text-right">{label}</p>
      <div className={cn(
        'flex items-center gap-2.5 px-4 py-3 rounded-2xl border bg-muted/40 border-border/40',
        fullWidth && 'min-h-[72px] items-start',
      )}>
        {resolvedIcon && <span className="flex-shrink-0 text-muted-foreground">{resolvedIcon}</span>}
        <span className="flex-1 text-sm font-medium text-foreground text-right whitespace-pre-wrap">{displayValue}</span>
      </div>
    </div>
  );
}

function AgendaTable({ items }: { items: AgendaItem[] }) {
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
          {items.length > 0 ? (
            items.map((item, idx) => (
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
            ))
          ) : (
            <tr>
              <td colSpan={hasOtherText ? 5 : 4} className="px-4 py-6 text-center text-muted-foreground">
                لا توجد بنود
              </td>
            </tr>
          )}
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

      {/* First section (basic info) — show all fields */}
      {data.sections[0] && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {data.sections[0].fields.filter(f => f.value !== null).map(field => (
            <FieldCell key={field.key} {...field} fieldKey={field.key} />
          ))}
        </div>
      )}

      {/* Agenda — always show table with headers */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground">أجندة الاجتماع</h3>
        <AgendaTable items={data.agenda ?? []} />
      </div>

      {/* Remaining sections — show all fields */}
      {data.sections.slice(1).map((section, sIdx) => (
        <div key={sIdx + 1} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {section.fields.map(field => (
            <FieldCell key={field.key} {...field} fieldKey={field.key} />
          ))}
        </div>
      ))}
    </div>
  );
}