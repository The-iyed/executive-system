import { MeetingCardData } from '@/modules/shared/components/meeting-card';
import { formatDateArabic } from '@/modules/shared/utils';
import { ContentRequestApiResponse } from '../data/contentApi';
import { MeetingStatus, MeetingStatusLabels, getMeetingChannelLabel, getMeetingClassificationLabel } from '@/modules/shared/types';

/**
 * Map API status to component status
 */
const mapStatus = (apiStatus: string): MeetingStatus | string => {
  const statusMap: Record<string, MeetingStatus | string> = {
    UNDER_CONTENT_REVIEW: 'UNDER_CONTENT_REVIEW',
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
  if (status === 'UNDER_CONTENT_REVIEW') {
    return 'قيد مراجعة المحتوى';
  }
  return status;
};

/**
 * Map API content request response to MeetingCardData (for table view)
 */
export const mapContentRequestToCardData = (
  request: ContentRequestApiResponse
): MeetingCardData => {
  const status = mapStatus(request.status);
  const statusLabel = getStatusLabel(status);
  const dateToUse = request.submitted_at || request.created_at;

  return {
    id: request.id,
    title: request.meeting_title || request.meeting_subject,
    date: formatDateArabic(dateToUse),
    coordinator: request.submitter_name ?? undefined,
    coordinatorAvatar: undefined,
    status: status,
    statusLabel: statusLabel,
    location: request.meeting_channel,
  };
};

/**
 * Map API content request response to MeetingCardData (for card view — shared card)
 */
export const mapContentRequestToCardViewData = (
  request: ContentRequestApiResponse
): MeetingCardData => {
  const status = mapStatus(request.status);
  const statusLabel = getStatusLabel(status);
  const dateToUse = request.submitted_at || request.created_at;

  return {
    id: request.id,
    requestNumber: request.request_number,
    title: request.meeting_title || request.meeting_subject,
    date: formatDateArabic(dateToUse),
    coordinator: request.submitter_name ?? undefined,
    coordinatorAvatar: undefined,
    status: status,
    statusLabel: statusLabel,
    meetingCategory: getMeetingClassificationLabel(request.meeting_classification),
    location: getMeetingChannelLabel(request.meeting_channel),
    meetingDate: request.scheduled_at ? formatDateArabic(request.scheduled_at) : undefined,
    isDataComplete: request.is_data_complete,
  };
};

