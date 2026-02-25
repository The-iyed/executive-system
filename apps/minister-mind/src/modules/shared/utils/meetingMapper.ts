/**
 * Shared meeting API response to card/display data mapper.
 * Use with MeetingApiResponse from @shared/types.
 */
import type { MeetingCardData } from '../components/meeting-card';
import type { MeetingApiResponse } from '../types';
import { MeetingStatus, MeetingStatusLabels, getMeetingClassificationLabel } from '../types';
import { formatDateIslamic } from './format';

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
 * Map API meeting response to MeetingCardData for cards and lists.
 */
export function mapMeetingToCardData(meeting: MeetingApiResponse): MeetingCardData {
  const status = mapStatus(meeting.status);
  const statusLabel = getStatusLabel(status);
  const dateToUse = meeting.submitted_at || meeting.created_at;
  return {
    id: meeting.id,
    requestNumber: meeting.request_number,
    title: meeting.meeting_title || meeting.meeting_subject,
    date: formatDateIslamic(dateToUse) || '',
    coordinator: meeting.submitter_name,
    coordinatorAvatar: undefined,
    status,
    statusLabel,
    location: meeting.meeting_channel,
    meetingCategory: getMeetingClassificationLabel(meeting.meeting_classification),
    meetingDate: meeting.scheduled_at ? formatDateIslamic(meeting.scheduled_at) : undefined,
    isDataComplete:
      meeting.is_data_complete == null ? undefined : Boolean(meeting.is_data_complete),
  };
}
