import React from 'react';
import type { MeetingApiResponse } from '../../../../UC02/data/meetingsApi';
import { MeetingPreviewTabs } from '../constants';

interface NotesTabProps {
  meeting: MeetingApiResponse;
}

interface NoteCard {
  id: string;
  title: string;
  description: string;
  tag: string;
}

interface NoteItem {
  text: string;
}

const normalizeNotes = (
  notesArray: NoteItem[] | null | undefined
): string[] => {
  if (!Array.isArray(notesArray)) return [];
  return notesArray
    .filter((note) => note != null && note.text != null)
    .map((note) => String(note.text))
    .filter((text) => text.trim().length > 0);
};

const createNoteCard = (
  note: string,
  index: number,
  prefix: string,
  title: string,
  tag: string
): NoteCard => ({
  id: `${prefix}_${index}`,
  title,
  description: note,
  tag,
});

export const NotesTab: React.FC<NotesTabProps> = ({ meeting }) => {
  const notes: NoteCard[] = [];

  const generalNotes = normalizeNotes(
    meeting.general_notes as NoteItem[] | null
  );
  generalNotes.forEach((note, index) => {
    notes.push(
      createNoteCard(
        note,
        index,
        'general_notes',
        'الملاحظات العامة',
        'ملاحظات مسؤول الجدولة'
      )
    );
  });

  const contentOfficerNotes = normalizeNotes(
    meeting.content_officer_notes as NoteItem[] | null
  );
  contentOfficerNotes.forEach((note, index) => {
    notes.push(
      createNoteCard(
        note,
        index,
        'content_officer_notes',
        'ملاحظات مسؤول المحتوى',
        'ملاحظات مسؤول المحتوى'
      )
    );
  });

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#475467] text-base">لا توجد ملاحظات متاحة</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="bg-white border border-[#E6E6E6] rounded-2xl flex flex-col gap-[10px] pt-[10px] pr-[34px] pb-[10px] pl-[10px]"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-[#101828] m-0">
              {MeetingPreviewTabs.NOTES}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#F2F4F7] text-[#475467]">
              {note.tag}
            </span>
          </div>
          <p className="font-normal text-base text-[#475467] m-0">
            {note.description}
          </p>
        </div>
      ))}
    </div>
  );
};
