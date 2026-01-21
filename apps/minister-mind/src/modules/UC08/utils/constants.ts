import { TabItem } from '@shared/components/tabs';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';

export enum MeetingOwnerType {
  SUBMITTER = 'SUBMITTER',
  SCHEDULING = 'SCHEDULING',
  CONTENT = 'CONTENT',
}

export const MeetingOwnerTypeLabels: Record<MeetingOwnerType, string> = {
  [MeetingOwnerType.SUBMITTER]: 'مقدم الطلب',
  [MeetingOwnerType.SCHEDULING]: 'مسؤول الجدولة',
  [MeetingOwnerType.CONTENT]: 'مسؤول المحتوى',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  ITEMS_PER_PAGE: 6,
  DEBOUNCE_DELAY: 500,
} as const;

export const MEETING_TABS: TabItem[] = [
  {
    id: MeetingStatus.UNDER_REVIEW,
    label: MeetingStatusLabels[MeetingStatus.UNDER_REVIEW],
  },
  {
    id: MeetingStatus.RETURNED_FROM_SCHEDULING_MANAGER,
    label: MeetingStatusLabels[MeetingStatus.RETURNED_FROM_SCHEDULING_MANAGER],
  },
  {
    id: MeetingStatus.RETURNED_FROM_CONTENT_MANAGER,
    label: MeetingStatusLabels[MeetingStatus.RETURNED_FROM_CONTENT_MANAGER],
  },
];

export interface TabFilterConfig {
  status: MeetingStatus;
  owner_type: MeetingOwnerType;
}

export const TAB_FILTER_MAP: Partial<Record<MeetingStatus, TabFilterConfig>> = {
  [MeetingStatus.UNDER_REVIEW]: {
    status: MeetingStatus.UNDER_REVIEW,
    owner_type: MeetingOwnerType.SCHEDULING,
  },
  [MeetingStatus.RETURNED_FROM_SCHEDULING_MANAGER]: {
    status: MeetingStatus.UNDER_REVIEW,
    owner_type: MeetingOwnerType.SUBMITTER,
  },
  [MeetingStatus.RETURNED_FROM_CONTENT_MANAGER]: {
    status: MeetingStatus.UNDER_REVIEW,
    owner_type: MeetingOwnerType.SUBMITTER,
  },
};

