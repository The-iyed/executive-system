import { MeetingCardData } from '@shared/components/meeting-card';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';
import { MeetingApiResponse } from '../data/meetingsApi';

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return dateString;
  }
};

const STATUS_MAP: Record<string, MeetingStatus> = {
  [MeetingStatus.DRAFT]: MeetingStatus.DRAFT,
  [MeetingStatus.UNDER_REVIEW]: MeetingStatus.UNDER_REVIEW,
  [MeetingStatus.SCHEDULED]: MeetingStatus.SCHEDULED,
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
  [MeetingStatus.REJECTED]: MeetingStatus.REJECTED,
  [MeetingStatus.CANCELLED]: MeetingStatus.CANCELLED,
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
}

export const mapMeetingToCardData = (meeting: MeetingApiResponse): MeetingDisplayData => {
  const status = mapStatus(meeting.status);
  const statusLabel = getStatusLabel(status);
  
  const dateToUse = meeting.submitted_at || meeting.created_at;
  
  return {
    id: meeting.id,
    requestNumber: meeting.request_number,
    title: meeting.meeting_title || meeting.meeting_subject,
    date: formatDate(dateToUse),
    coordinator: meeting.submitter_name,
    coordinatorAvatar: undefined,
    status: status,
    statusLabel: statusLabel,
    location: meeting.meeting_channel,
  };
};
