import type { MeetingCardData } from '../components/meeting-card';
import { MeetingStatus, MeetingStatusLabels, getMeetingClassificationLabel } from '../types';
import { formatDateIslamic } from './format';

/** Minimal shape the mapper needs — works with any module's MeetingApiResponse */
export interface MeetingMapperInput {
  id: string;
  request_number: string;
  status: string;
  meeting_title?: string | null;
  meeting_subject?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
  submitter_name?: string | null;
  meeting_channel?: string | null;
  meeting_classification?: string | null;
  meeting_start_date?: string | null;
  is_data_complete?: boolean | null;
}

const STATUS_MAP: Record<string, MeetingStatus | string> = {
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
  WAITING: MeetingStatus.WAITING,
};

function mapStatus(apiStatus: string): MeetingStatus | string {
  return STATUS_MAP[apiStatus] ?? apiStatus;
}

function getStatusLabel(status: MeetingStatus | string): string {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  if (status === 'redirected') return 'معاد من التوجيه';
  return String(status);
}

/**
 * Map any meeting API response to MeetingCardData for cards and lists.
 * Accepts any object matching MeetingMapperInput (loose coupling).
 */
export function mapMeetingToCardData(meeting: MeetingMapperInput): MeetingCardData {
  const status = mapStatus(meeting.status);
  const statusLabel = getStatusLabel(status);
  const dateToUse = meeting.submitted_at || meeting.created_at;
  return {
    id: meeting.id,
    requestNumber: meeting.request_number,
    title: meeting.meeting_title || meeting.meeting_subject || '',
    date: formatDateIslamic(dateToUse) || '',
    coordinator: meeting.submitter_name || '',
    coordinatorAvatar: undefined,
    status,
    statusLabel,
    location: meeting.meeting_channel || '',
    meetingCategory: getMeetingClassificationLabel(meeting.meeting_classification) ?? undefined,
    meetingDate: meeting.meeting_start_date ? formatDateIslamic(meeting.meeting_start_date) : undefined,
    isDataComplete:
      meeting.is_data_complete == null ? undefined : Boolean(meeting.is_data_complete),
  };
}
