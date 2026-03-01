import type { Step1FormData } from '../schemas/step1.schema';

const FOLLOW_UP_OR_RECURRING = ['SEQUENTIAL', 'PERIODIC'] as const;
const CATEGORIES_REQUIRING_REASON = ['PRIVATE_MEETING', 'BILATERAL_MEETING'] as const;
const CATEGORY_TOPIC_AND_DUE = 'GOVERNMENT_CENTER_TOPICS' as const;
const CHANNEL_PHYSICAL = 'PHYSICAL' as const;

export function isStep1FieldVisible(
  field: keyof Step1FormData,
  data: Partial<Step1FormData>
): boolean {
  switch (field) {
    case 'previousMeeting':
      return FOLLOW_UP_OR_RECURRING.includes(data.meetingNature as (typeof FOLLOW_UP_OR_RECURRING)[number]);
    case 'urgentReason':
      return data.isUrgent === true;
    case 'location':
      return data.meeting_channel === CHANNEL_PHYSICAL;
    case 'meetingReason':
      return !!data.meetingCategory && CATEGORIES_REQUIRING_REASON.includes(data.meetingCategory as (typeof CATEGORIES_REQUIRING_REASON)[number]);
    case 'relatedTopic':
    case 'dueDate':
      return data.meetingCategory === CATEGORY_TOPIC_AND_DUE;
    default:
      return true;
  }
}