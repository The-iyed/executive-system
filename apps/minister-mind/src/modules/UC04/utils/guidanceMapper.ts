import { MeetingCardData } from '@shared/components/meeting-card';
import { GuidanceRequestApiResponse } from '../data/guidanceApi';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';
import { GuidanceRequestCardData } from '../components/guidance-request-card';

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

/**
 * Map API status to component status
 */
const mapStatus = (apiStatus: string): MeetingStatus | string => {
  // Map API status to MeetingStatus enum
  const statusMap: Record<string, MeetingStatus | string> = {
    UNDER_GUIDANCE: 'UNDER_GUIDANCE',
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
  // Handle custom statuses
  if (status === 'UNDER_GUIDANCE') {
    return 'قيد التوجيه';
  }
  return status;
};

/**
 * Map API guidance request response to MeetingCardData (for table view)
 */
export const mapGuidanceRequestToCardData = (
  request: GuidanceRequestApiResponse
): MeetingCardData => {
  const status = mapStatus(request.status);
  const statusLabel = getStatusLabel(status);

  // Use submitted_at for date, fallback to created_at
  const dateToUse = request.submitted_at || request.created_at;

  return {
    id: request.id,
    title: request.meeting_title || request.meeting_subject,
    date: formatDate(dateToUse),
    coordinator: request.submitter_name,
    coordinatorAvatar: undefined, // API doesn't provide avatar
    status: status,
    statusLabel: statusLabel,
    location: request.meeting_channel,
  };
};

/**
 * Map API guidance request response to GuidanceRequestCardData (for card view)
 */
export const mapGuidanceRequestToCardViewData = (
  request: GuidanceRequestApiResponse
): GuidanceRequestCardData => {
  const status = mapStatus(request.status);
  const statusLabel = getStatusLabel(status);

  // Use submitted_at for date, fallback to created_at
  const dateToUse = request.submitted_at || request.created_at;

  return {
    id: request.id,
    requestNumber: request.request_number,
    title: request.meeting_title || request.meeting_subject,
    date: formatDate(dateToUse),
    submitter: request.submitter_name,
    status: status,
    statusLabel: statusLabel,
  };
};

