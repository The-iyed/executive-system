/**
 * UC01 Notes tab – thin wrapper around the shared RequestNotesView.
 */
import React from 'react';
import { RequestNotesView, mapMeetingToRequestNotes } from '@/modules/shared/features/request-notes';
import type { RawMeetingForNotes } from '@/modules/shared/features/request-notes';

interface NotesTabProps {
  meeting: RawMeetingForNotes;
}

export const NotesTab: React.FC<NotesTabProps> = ({ meeting }) => {
  const data = mapMeetingToRequestNotes(meeting);
  return <RequestNotesView data={data} />;
};
