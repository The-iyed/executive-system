import React from 'react';
import { FileText, CalendarClock, StickyNote, MessageSquare } from 'lucide-react';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';

interface NotesTabProps {
  meeting: MeetingApiResponse & {
    content_officer_notes?: string | null;
    scheduling_officer_note?: string | null;
  };
}

/** Normalize API general_notes (array of { text } or string) to a single string. */
function getGeneralNotesText(generalNotes: unknown): string {
  if (generalNotes == null) return '';
  if (typeof generalNotes === 'string' && generalNotes.trim()) return generalNotes.trim();
  if (Array.isArray(generalNotes)) {
    const parts = generalNotes
      .map((n: { text?: string }) => (n && typeof n.text === 'string' ? n.text.trim() : ''))
      .filter(Boolean);
    if (parts.length) return parts.join('\n');
  }
  return '';
}

const noteConfig = {
  content: {
    title: 'ملاحظات مسؤول المحتوى',
    icon: FileText,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  scheduling: {
    title: 'ملاحظات مسؤول الجدولة',
    icon: CalendarClock,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  general: {
    title: 'ملاحظات إضافية',
    icon: MessageSquare,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
  },
} as const;

function NoteBlock({
  title,
  text,
  variant,
}: {
  title: string;
  text: string;
  variant: 'content' | 'scheduling' | 'general';
}) {
  const config = noteConfig[variant];
  const Icon = config.icon;

  return (
    <article className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${config.iconBg} ${config.iconColor}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {title}
          </span>
        </div>
        <div className="min-h-[3rem] rounded-lg bg-gray-50/80 px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-[15px] leading-[1.7] text-gray-800 whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </div>
    </article>
  );
}

export const NotesTab: React.FC<NotesTabProps> = ({ meeting }) => {
  const contentOfficerNotes = (meeting.content_officer_notes ?? '').trim();
  const schedulingOfficerNote = (meeting.scheduling_officer_note ?? '').trim();
  const generalNotesText = getGeneralNotesText(meeting.general_notes);

  const hasContentNotes = contentOfficerNotes.length > 0;
  const hasSchedulingNotes = schedulingOfficerNote.length > 0;
  const hasGeneralNotes = generalNotesText.length > 0;
  const hasAnyNotes = hasContentNotes || hasSchedulingNotes || hasGeneralNotes;

  if (!hasAnyNotes) {
    return (
      <div className="flex flex-col gap-5 w-full" dir="rtl">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800">
            الملاحظات على الطلب
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <StickyNote className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-gray-600">
              لا توجد ملاحظات
            </p>
            <p className="text-sm text-gray-500">
              لم يتم إضافة ملاحظات من مسؤول المحتوى أو مسؤول الجدولة بعد
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800">
          الملاحظات المسجلة
        </h2>
      </div>
      <div className="flex flex-col gap-4">
        {hasContentNotes && (
          <NoteBlock
            title={noteConfig.content.title}
            text={contentOfficerNotes}
            variant="content"
          />
        )}
        {hasSchedulingNotes && (
          <NoteBlock
            title={noteConfig.scheduling.title}
            text={schedulingOfficerNote}
            variant="scheduling"
          />
        )}
        {hasGeneralNotes && (
          <NoteBlock
            title={noteConfig.general.title}
            text={generalNotesText}
            variant="general"
          />
        )}
      </div>
    </div>
  );
};
