import { MeetingCardData } from '@shared/components/meeting-card';
import { MeetingStatus, MeetingStatusLabels, getMeetingClassificationLabel } from '@shared/types';
import { MeetingApiResponse } from '../data/meetingsApi';

/**
 * Format date to Arabic format
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Format as: "الاثنين، 23 شعبان 1447 هـ"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'islamic',
      numberingSystem: 'arab',
    };
    
    const formatted = new Intl.DateTimeFormat('ar-SA', options).format(date);
    return formatted;
  } catch (error) {
    // Fallback to simple date format
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA');
    } catch {
      return dateString;
    }
  }
};

const STATUS_MAP: Record<string, MeetingStatus> = {
  [MeetingStatus.DRAFT]: MeetingStatus.DRAFT,
  [MeetingStatus.UNDER_REVIEW]: MeetingStatus.UNDER_REVIEW,
  [MeetingStatus.SCHEDULED]: MeetingStatus.SCHEDULED,
  [MeetingStatus.SCHEDULED_SCHEDULING]: MeetingStatus.SCHEDULED_SCHEDULING,
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
  [MeetingStatus.REJECTED]: MeetingStatus.REJECTED,
  [MeetingStatus.CANCELLED]: MeetingStatus.CANCELLED,
  [MeetingStatus.CLOSED]: MeetingStatus.CLOSED,
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: MeetingStatus.RETURNED_FROM_SCHEDULING,
  [MeetingStatus.RETURNED_FROM_CONTENT]: MeetingStatus.RETURNED_FROM_CONTENT,
};

const mapStatus = (apiStatus: string): MeetingStatus | string => {
  if (apiStatus in STATUS_MAP) {
    return STATUS_MAP[apiStatus];
  }
  return apiStatus;
};

const getStatusLabel = (status: MeetingStatus | string): string => {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  return status;
};

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
  // Prefer explicit arrays when available (same shape used in preview Notes tab)
  const general = normalizeNotes(meeting.general_notes);
  const content = normalizeNotes(meeting.content_officer_notes);
  const all = [...general, ...content];
  if (all.length === 0) return '-';
  // Show the most recent note (last) for compact table display
  return all[all.length - 1];
};

export const mapMeetingToCardData = (meeting: MeetingApiResponse): MeetingDisplayData => {
  const status = mapStatus(meeting.status);
  const statusLabel = getStatusLabel(status);
  
  const requestDateIso = meeting.submitted_at || meeting.created_at;
  const requestDate = formatDate(requestDateIso);
  const meetingDate = meeting.scheduled_at ? formatDate(meeting.scheduled_at) : '-';
  const meetingCategory = getMeetingClassificationLabel(meeting.meeting_classification);
  
  return {
    id: meeting.id,
    requestNumber: meeting.request_number,
    title: meeting.meeting_title || meeting.meeting_subject,
    // For cards, show meeting date when scheduled; otherwise fall back to request date
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