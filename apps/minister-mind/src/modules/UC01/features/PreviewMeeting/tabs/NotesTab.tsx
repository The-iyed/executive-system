import React from 'react';
import { Clock } from 'lucide-react';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';
import type { GeneralNoteItem } from '../../../../UC02/data/meetingsApi';

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

interface NotesTabProps {
  meeting: MeetingApiResponse;
}

/** Normalize API general_notes (array of GeneralNoteItem or legacy array of { text }) to list for display */
function getGeneralNotesList(
  generalNotes: GeneralNoteItem[] | { text?: string }[] | string | null | undefined
): { id: string; author_name: string | null; author_type: string; note_type: string; text: string; created_at: string }[] {
  if (generalNotes == null) return [];
  if (Array.isArray(generalNotes)) {
    return generalNotes.map((note, index) => {
      const item = note as GeneralNoteItem & { text?: string };
      const text = typeof item.text === 'string' ? item.text : (item as { text?: string }).text ?? '';
      if (text.trim() === '') return null;
      return {
        id: (item as GeneralNoteItem).id ?? `note-${index}`,
        author_name: (item as GeneralNoteItem).author_name ?? null,
        author_type: (item as GeneralNoteItem).author_type ?? 'ملاحظات',
        note_type: (item as GeneralNoteItem).note_type ?? 'ملاحظة',
        text,
        created_at: (item as GeneralNoteItem).created_at ?? '',
      };
    }).filter(Boolean) as { id: string; author_name: string | null; author_type: string; note_type: string; text: string; created_at: string }[];
  }
  if (typeof generalNotes === 'string' && generalNotes.trim() !== '') {
    return [{ id: 'note-0', author_name: null, author_type: 'ملاحظات', note_type: 'ملاحظة', text: generalNotes, created_at: '' }];
  }
  return [];
}

export const NotesTab: React.FC<NotesTabProps> = ({ meeting }) => {
  const notesList = getGeneralNotesList(meeting.general_notes);

  if (notesList.length === 0) {
    return (
      <div className="flex flex-col gap-4 w-full" dir="rtl">
        <label className="text-sm font-medium text-gray-700 text-right" style={fontStyle}>
          الملاحظات على الطلب
        </label>
        <div className="flex items-center justify-center py-12">
          <p className="text-[#475467] text-base" style={fontStyle}>لا توجد ملاحظات متاحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full" dir="rtl">
      <label className="text-sm font-medium text-gray-700 text-right" style={fontStyle}>
        الملاحظات المسجلة
      </label>
      <div className="flex flex-col gap-[10px] w-full">
        {notesList.map((note) => (
          <div
            key={note.id}
            className="flex flex-col justify-center items-center p-[3px] gap-[10px] w-full rounded-[9.26px]"
            style={{ background: '#E6ECF5' }}
          >
            <div
              className="flex flex-col items-end w-full py-[10px] px-[8.5px] gap-[7.13px] rounded-[8.05px] bg-white"
              style={fontStyle}
            >
              <div className="flex flex-row justify-between items-start w-full gap-[15px]">
                <div className="flex flex-col justify-center items-end gap-[4.28px] min-w-0 flex-1">
                  <span className="text-[15.67px] font-bold leading-5 text-right" style={{ color: '#383838', ...fontStyle }}>
                    {note.author_name || note.author_type || note.note_type || 'ملاحظة'}
                  </span>
                  <p className="text-[10px] leading-[11px] text-right whitespace-pre-wrap" style={{ color: '#18192B', ...fontStyle }}>
                    {note.text}
                  </p>
                </div>
                <div className="flex flex-row justify-between items-center gap-3 flex-shrink-0">
                  <div className="flex flex-row justify-center items-center gap-2 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(0, 167, 157, 0.06)' }}>
                    <span className="text-[10px] leading-[11px]" style={{ color: '#00A79D', ...fontStyle }}>
                      مكتمل
                    </span>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-2">
                    <span className="text-[9px] leading-[10px] text-right" style={{ color: '#2C2C2C', ...fontStyle }}>
                      {note.created_at ? `تاريخ الطلب : ${new Date(note.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}` : '—'}
                    </span>
                    <Clock className="w-3 h-3 text-[#475467]" strokeWidth={1.08} aria-hidden />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
