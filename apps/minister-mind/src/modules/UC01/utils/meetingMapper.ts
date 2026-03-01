import { MeetingCardData } from '@shared/components/meeting-card';
import { MeetingOwnerType, getMeetingClassificationLabel } from '@shared/types';
import { getMeetingStatusLabel, formatDateArabic, meetingStatusByRole } from '@shared/utils';
import { MeetingApiResponse } from '../data/meetingsApi';

export interface MeetingDisplayData extends MeetingCardData {
  requestNumber: string;
  requestDate: string;
  meetingCategory: string;
  meetingDate: string;
  isDataComplete: boolean | null;
  returnNotes: string;
}

type NoteItem = { text?: unknown };

const normalizeNotes = (notes: unknown): string[] => {
  if (!Array.isArray(notes)) return [];
  return (notes as unknown[])
    .map((n) => {
      if (typeof n === 'string') return n;
      const obj = n as NoteItem;
      return obj?.text != null ? String(obj.text) : '';
    })
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);
};

const getReturnNotes = (meeting: MeetingApiResponse): string => {
  const general = normalizeNotes(meeting.general_notes);
  const content = normalizeNotes(meeting.content_officer_notes);
  const all = [...general, ...content];
  if (all.length === 0) return '-';
  return all[all.length - 1];
};

export const mapMeetingToCardData = (meeting: MeetingApiResponse): MeetingDisplayData => {
  const status = meetingStatusByRole(meeting?.status, MeetingOwnerType.SUBMITTER);
  const statusLabel = getMeetingStatusLabel(status);
  
  const requestDateIso = meeting.submitted_at || meeting.created_at;
  const requestDate = formatDateArabic(requestDateIso);
  const meetingDate = meeting.meeting_start_date ? formatDateArabic(meeting.meeting_start_date) : '-';
  const meetingCategory = getMeetingClassificationLabel(meeting.meeting_classification);
  
  return {
    id: meeting.id,
    requestNumber: meeting.request_number,
    title: meeting.meeting_title || meeting.meeting_subject,
    date: meetingDate !== '-' ? meetingDate : requestDate,
    requestDate,
    meetingCategory,
    meetingDate,
    isDataComplete:
      meeting.is_data_complete == null ? null : Boolean(meeting.is_data_complete),
    returnNotes: getReturnNotes(meeting),
    coordinator: meeting.submitter_name,
    coordinatorAvatar: undefined,
    status: status,
    statusLabel: statusLabel,
    location: meeting.meeting_channel,
  };
};