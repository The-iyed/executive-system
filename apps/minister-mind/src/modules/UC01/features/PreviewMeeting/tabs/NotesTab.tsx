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

const normalizeNotes = (notesValue: string | string[] | null | undefined): string[] => {
  if (!notesValue) return [];
  if (Array.isArray(notesValue)) {
    return notesValue.filter((note) => note && note.trim().length > 0);
  }
  return [notesValue];
};

export const NotesTab: React.FC<NotesTabProps> = ({ meeting }) => {
  const notes: NoteCard[] = [];

  // Handle general_notes - can be string or array
  const generalNotes = normalizeNotes(meeting.general_notes);
  if (generalNotes.length > 0) {
    generalNotes.forEach((note, index) => {
      notes.push({
        id: `general_notes_${index}`,
        title: 'الملاحظات العامة',
        description: note,
        tag: 'ملاحظات مسؤول الجدولة',
      });
    });
  }

  // Handle content_officer_notes - can be string or array
  const contentOfficerNotes = normalizeNotes(meeting.content_officer_notes);
  if (contentOfficerNotes.length > 0) {
    contentOfficerNotes.forEach((note, index) => {
      notes.push({
        id: `content_officer_notes_${index}`,
        title: 'ملاحظات مسؤول المحتوى',
        description: note,
        tag: 'ملاحظات مسؤول المحتوى',
      });
    });
  }

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
