/**
 * UC05 Notes tab – displays scheduling officer notes for content.
 */
import { CalendarClock, StickyNote } from 'lucide-react';

export interface NotesTabProps {
  schedulingContentNote: string;
}

export function NotesTab({ schedulingContentNote }: NotesTabProps) {
  return (
    <div className="flex flex-col gap-5 w-full max-w-[900px] mx-auto" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">الملاحظات</h2>
      </div>

      {schedulingContentNote ? (
        <article className="relative w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                ملاحظات مسؤول الجدولة على المحتوى
              </span>
            </div>
            <div className="min-h-[3rem] rounded-lg bg-muted/50 px-4 py-3 sm:px-5 sm:py-4">
              <p className="text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap">
                {schedulingContentNote}
              </p>
            </div>
          </div>
        </article>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <StickyNote className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">لا توجد ملاحظات على المحتوى</p>
            <p className="text-sm text-muted-foreground">لم يتم إضافة ملاحظات من مسؤول الجدولة على المحتوى بعد</p>
          </div>
        </div>
      )}
    </div>
  );
}
