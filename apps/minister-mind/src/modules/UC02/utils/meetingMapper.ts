import { MeetingCardData } from '@shared/components/meeting-card';
import { formatDateArabic } from '@shared/utils';
import { MeetingApiResponse } from '../data/meetingsApi';
import { MeetingStatus, MeetingStatusLabels, getMeetingClassificationLabel } from '@shared/types';

/**
 * Map API status to component status
 */
const mapStatus = (apiStatus: string): MeetingStatus | string => {
  // Map API status to MeetingStatus enum
  const statusMap: Record<string, MeetingStatus | string> = {
    'UNDER_REVIEW': MeetingStatus.UNDER_REVIEW,
    'SCHEDULED': MeetingStatus.SCHEDULED,
    'DRAFT': MeetingStatus.DRAFT,
    'REJECTED': MeetingStatus.REJECTED,
    'CANCELLED': MeetingStatus.CANCELLED,
    'CLOSED': MeetingStatus.CLOSED,
    'WAITING': MeetingStatus.WAITING,
  };

  return statusMap[apiStatus] || apiStatus;
};

/**
 * Get status label from status
 */
const getStatusLabel = (status: MeetingStatus | string): string => {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  // Handle custom statuses
  if (status === 'redirected') {
    return 'معاد من التوجيه';
  }
  return status;
};

/**
 * Map API meeting response to MeetingCardData
 */
export const mapMeetingToCardData = (meeting: MeetingApiResponse): MeetingCardData => {
  const status = mapStatus(meeting.status);
  const statusLabel = getStatusLabel(status);
  
  // Use submitted_at for date, fallback to created_at
  const dateToUse = meeting.submitted_at || meeting.created_at;
  
  return {
    id: meeting.id,
    requestNumber: meeting.request_number,
    title: meeting.meeting_title || meeting.meeting_subject,
    date: formatDateArabic(dateToUse),
    coordinator: meeting.submitter_name,
    coordinatorAvatar: undefined,
    status: status,
    statusLabel: statusLabel,
    location: meeting.meeting_channel,
    meetingCategory: getMeetingClassificationLabel(meeting.meeting_classification),
    meetingDate: meeting.meeting_start_date ? formatDateArabic(meeting.meeting_start_date) : undefined,
    isDataComplete: meeting.is_data_complete == null ? undefined : Boolean(meeting.is_data_complete),
  };
};

