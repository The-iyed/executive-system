import { MeetingCardData } from '@shared/components/meeting-card';
import { formatDateArabic } from '@shared/utils';
import { ConsultationRequestApiResponse } from '../data/consultationsApi';
import { MeetingStatus, getMeetingChannelLabel, getMeetingClassificationLabel } from '@shared/types';
import { getMeetingStatusLabel } from '@shared';
import { ConsultationRequestCardData } from '../components/consultation-request-card';

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
 * Map API consultation request response to MeetingCardData (for table view)
 */
export const mapConsultationRequestToCardData = (
  request: ConsultationRequestApiResponse
): MeetingCardData => {
  const status = mapStatus(request.status);
  const statusLabel = getMeetingStatusLabel(status);
  const locationLabel = getMeetingChannelLabel(request.meeting_channel);

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
    location: locationLabel,
  };
};

/**
 * Map API consultation request response to ConsultationRequestCardData (for card view)
 */
export const mapConsultationRequestToCardViewData = (
  request: ConsultationRequestApiResponse
): ConsultationRequestCardData => {
  const status = mapStatus(request.status);
  const statusLabel = getMeetingStatusLabel(status);
  const locationLabel = getMeetingChannelLabel(request.meeting_channel);

  // Use submitted_at for date, fallback to created_at
  const dateToUse = request.submitted_at || request.created_at;

  return {
    id: request.id,
    requestNumber: request.request_number,
    title: request.meeting_title || request.meeting_subject,
    date: formatDateArabic(dateToUse),
    submitter: request.submitter_name ?? undefined,
    status: status,
    statusLabel: statusLabel,
    meetingCategory: getMeetingClassificationLabel(request.meeting_classification),
    location: locationLabel,
    meetingDate: request.scheduled_at ? formatDateArabic(request.scheduled_at) : undefined,
    isDataComplete: request.is_data_complete,
  };
};

