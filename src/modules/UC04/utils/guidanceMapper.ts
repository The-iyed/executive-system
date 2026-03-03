import { MeetingCardData } from '@/modules/shared/components/meeting-card';
import { formatDateArabic } from '@/modules/shared/utils';
import { GuidanceRequestApiResponse } from '../data/guidanceApi';
import { MeetingStatus, getMeetingClassificationLabel } from '@/modules/shared/types';
import { getMeetingStatusLabel } from '@/modules/shared';
import { GuidanceRequestCardData } from '../components/guidance-request-card';

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
 * Map API guidance request response to MeetingCardData (for table view)
 */
export const mapGuidanceRequestToCardData = (
  request: GuidanceRequestApiResponse
): MeetingCardData => {
  const status = mapStatus(request.status);
  const statusLabel = getMeetingStatusLabel(status);

  // Use submitted_at for date, fallback to created_at
  const dateToUse = request.submitted_at || request.created_at;

  return {
    id: request.id,
    title: request.meeting_title || request.meeting_subject,
    date: formatDateArabic(dateToUse),
    coordinator: request.submitter_name ?? undefined,
    coordinatorAvatar: undefined,
    status: status,
    requestNumber: request.request_number,
    meetingCategory: getMeetingClassificationLabel(request.meeting_classification),
    meetingDate: request.scheduled_at ? formatDateArabic(request.scheduled_at) : undefined,
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
  const statusLabel = getMeetingStatusLabel(status);

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
    meetingDate: request.scheduled_at ? formatDateArabic(request.scheduled_at) : undefined,
    isDataComplete: request.is_data_complete == null ? undefined : Boolean(request.is_data_complete),
  };
};





