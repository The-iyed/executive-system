import { TabItem } from '@shared/components/tabs';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  ITEMS_PER_PAGE: 6,
  DEBOUNCE_DELAY: 500,
} as const;

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


export const MEETING_TABS = [
  {
    id: MeetingStatus.DRAFT,
    label: MeetingStatusLabels[MeetingStatus.DRAFT],
  },
  {
    id: MeetingStatus.RETURNED_FROM_SCHEDULING,
    label: MeetingStatusLabels[MeetingStatus.RETURNED_FROM_SCHEDULING],
  },
  {
    id: MeetingStatus.UNDER_REVIEW,
    label: MeetingStatusLabels[MeetingStatus.UNDER_REVIEW],
  },
  {
    id: MeetingStatus.SCHEDULED,
    label: MeetingStatusLabels[MeetingStatus.SCHEDULED],
  },
];

export interface TabFilterConfig {
  status: MeetingStatus;
  owner_type: MeetingOwnerType;
}

 export const TAB_FILTER_MAP: Partial<Record<MeetingStatus, TabFilterConfig>> = {
  [MeetingStatus.DRAFT]: {
    status: MeetingStatus.DRAFT,
    owner_type: MeetingOwnerType.SUBMITTER,
  },
  [MeetingStatus.UNDER_REVIEW]: {
    status: MeetingStatus.UNDER_REVIEW,
    owner_type: MeetingOwnerType.SCHEDULING,
  },
  // [MeetingStatus.SCHEDULED]: {
  //   status: MeetingStatus.SCHEDULED,
  //   owner_type: MeetingOwnerType.SUBMITTER,
  // },
  [MeetingStatus.SCHEDULED_SCHEDULING]: {
    status: MeetingStatus.SCHEDULED_SCHEDULING,
    owner_type: MeetingOwnerType.SUBMITTER,
  },
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: {
    status: MeetingStatus.UNDER_REVIEW,
    owner_type: MeetingOwnerType.SUBMITTER,
  },
  [MeetingStatus.RETURNED_FROM_CONTENT]: {
    status: MeetingStatus.UNDER_REVIEW,
    owner_type: MeetingOwnerType.SUBMITTER,
  },
};