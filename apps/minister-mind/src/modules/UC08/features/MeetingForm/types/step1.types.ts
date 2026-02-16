import type { Step1FormData as SchemaStep1FormData } from '../schemas/step1.schema';
export type Step1FormData = SchemaStep1FormData;

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface PreviousMeetingSummary {
  id: string;
  meeting_title?: string;
  meeting_subject?: string;
  meeting_date?: string;
  sector?: string;
  meeting_type?: string;
  meeting_category?: string;
  meeting_classification?: string;
  meeting_confidentiality?: string;
  submitter_id?: string;
  owner_id?: string;
  related_directive_id?: string | null;
  [key: string]: unknown;
}

export type Step1TabId = 'meeting-info' | 'other-sections';

export type MeetingNatureValue = 'NORMAL' | 'SEQUENTIAL' | 'PERIODIC';

export const MEETING_INFO_FIELDS: readonly (keyof Step1FormData)[] = [
  'meetingNature',
  'previousMeeting',
  'requester',
  'meetingOwner',
  'meetingTitle',
  'meetingSubject',
  'meetingSubjectOptional',
  'meetingDescription',
  'sector',
  'meetingType',
  'isUrgent',
  'urgentReason',
  'meetingStartDate',
  'meetingEndDate',
  'meeting_channel',
  'location',
  'requiresProtocol',
  'meetingCategory',
  'meetingReason',
  'relatedTopic',
  'dueDate',
  'meetingClassification1',
  'meetingConfidentiality',
  'relatedDirective',
  'notes',
] as const;