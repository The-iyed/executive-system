/**
 * Shared view for request notes — renders note blocks or an empty state.
 */
import { FileText, CalendarClock, StickyNote, MessageSquare, AlertCircle } from 'lucide-react';
import type { NoteVariant, RequestNotesViewProps } from './types';

const noteConfig: Record<NoteVariant, { icon: typeof FileText; iconBg: string; iconColor: string }> = {
  content:      { icon: FileText,     iconBg: 'bg-teal-50',   iconColor: 'text-teal-600' },
  scheduling:   { icon: CalendarClock, iconBg: 'bg-muted',     iconColor: 'text-muted-foreground' },
  general:      { icon: MessageSquare, iconBg: 'bg-amber-50',  iconColor: 'text-amber-700' },
  refusal:      { icon: AlertCircle,   iconBg: 'bg-red-50',    iconColor: 'text-red-600' },
  cancellation: { icon: AlertCircle,   iconBg: 'bg-muted',     iconColor: 'text-muted-foreground' },
};

function NoteBlock({ title, text, variant }: { title: string; text: string; variant: NoteVariant }) {
  const config = noteConfig[variant];
  const Icon = config.icon;

  return (
    <article className="relative w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${config.iconBg} ${config.iconColor}`}>
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {title}
          </span>
        </div>
        <div className="min-h-[3rem] rounded-lg bg-muted/50 px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </article>
  );
}

export function RequestNotesView({
  data,
  title = 'الملاحظات على الطلب',
  description = 'ملاحظات مسؤول المحتوى ومسؤول الجدولة على الطلب',
  emptyTitle = 'لا توجد ملاحظات',
  emptyDescription = 'لم يتم إضافة ملاحظات من مسؤول المحتوى أو مسؤول الجدولة بعد',
  className,
}: RequestNotesViewProps) {
  const hasNotes = data.notes.length > 0;

  return (
    <div className={`flex flex-col gap-6 w-full max-w-4xl mx-auto ${className ?? ''}`} dir="rtl">
      {/* Header with icon + title + description — same pattern as RequestInfo / MeetingInfoView */}
      <div className="flex items-start justify-end gap-3" dir="ltr">
        <div className="text-right">
          <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
          <StickyNote className="w-4 h-4" />
        </div>
      </div>

      {hasNotes ? (
        <div className="flex flex-col gap-4">
          {data.notes.map((note) => (
            <NoteBlock key={note.key} title={note.title} text={note.text} variant={note.variant} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <StickyNote className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">{emptyTitle}</p>
            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
}
