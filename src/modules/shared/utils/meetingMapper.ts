import type { MeetingCardData } from '../components/meeting-card';
import { MeetingStatus, MeetingStatusLabels, getMeetingClassificationLabel, getMeetingTypeLabel, getMeetingClassificationTypeLabel } from '../types';
import { formatDateIslamic } from './format';

/** Submitter object shape from API */
export interface SubmitterObject {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  ar_name?: string | null;
  position?: string | null;
  [key: string]: unknown;
}

/** Minimal shape the mapper needs — works with any module's MeetingApiResponse */
export interface MeetingMapperInput {
  id: string;
  request_number: string;
  status: string;
  meeting_title?: string | null;
  meeting_subject?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
  /** Legacy flat submitter name field */
  submitter_name?: string | null;
  /** New: submitter as nested object */
  submitter?: SubmitterObject | string | null;
  meeting_channel?: string | null;
  meeting_classification?: string | null;
  meeting_classification_type?: string | null;
  meeting_type?: string | null;
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

/** Extract display name from submitter (object or string) */
export function resolveSubmitterName(meeting: MeetingMapperInput): string {
  const sub = meeting.submitter;
  if (sub && typeof sub === 'object') {
    return sub.ar_name || sub.name || [sub.first_name, sub.last_name].filter(Boolean).join(' ') || sub.email || sub.username || '';
  }
  if (typeof sub === 'string') return sub;
  return meeting.submitter_name || '';
}

/**
 * Map any meeting API response to MeetingCardData for cards and lists.
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
    coordinator: resolveSubmitterName(meeting),
    coordinatorAvatar: undefined,
    status,
    statusLabel,
    location: meeting.meeting_channel || '',
    meetingCategory: getMeetingClassificationLabel(meeting.meeting_classification) ?? undefined,
    meetingType: getMeetingTypeLabel(meeting.meeting_type) !== '-' ? getMeetingTypeLabel(meeting.meeting_type) : undefined,
    meetingClassificationType: getMeetingClassificationTypeLabel(meeting.meeting_classification_type) !== '-' ? getMeetingClassificationTypeLabel(meeting.meeting_classification_type) : undefined,
    meetingDate: meeting.meeting_start_date ? formatDateIslamic(meeting.meeting_start_date) : undefined,
    isDataComplete:
      meeting.is_data_complete == null ? undefined : Boolean(meeting.is_data_complete),
  };
}
