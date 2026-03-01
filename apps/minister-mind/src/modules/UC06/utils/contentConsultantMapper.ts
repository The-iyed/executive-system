import { MeetingCardData } from '@shared/components/meeting-card';
import { formatDateArabic } from '@shared/utils';
import { ContentConsultationRequestApiResponse } from '../data/contentConsultantApi';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';

/**
 * Map API status to component status
 */
const mapStatus = (apiStatus: string): MeetingStatus | string => {
  // Map API status to MeetingStatus enum
  const statusMap: Record<string, MeetingStatus | string> = {
    UNDER_REVIEW: MeetingStatus.UNDER_REVIEW,
    SCHEDULED: MeetingStatus.SCHEDULED,
    DRAFT: MeetingStatus.DRAFT,
    REJECTED: MeetingStatus.REJECTED,
    CANCELLED: MeetingStatus.CANCELLED,
    CLOSED: MeetingStatus.CLOSED,
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
  return status;
};

/**
 * Map API content consultation request response to MeetingCardData (for table view)
 */
export const mapContentConsultationRequestToCardData = (
  request: ContentConsultationRequestApiResponse
): MeetingCardData => {
  const status = mapStatus(request.status);
  const statusLabel = getStatusLabel(status);

  // Use submitted_at for date, fallback to created_at
  const dateToUse = request.submitted_at || request.created_at;

  return {
    id: request.id,
    title: request.meeting_title || request.meeting_subject,
    date: formatDateArabic(dateToUse),
    coordinator: request.submitter_name ?? undefined,
    coordinatorAvatar: undefined, // API doesn't provide avatar
    status: status,
    statusLabel: statusLabel,
    location: request.meeting_channel,
  };
};


