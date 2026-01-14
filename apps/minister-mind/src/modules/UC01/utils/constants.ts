import { TabItem } from '@shared/components/tabs';
import { MeetingStatus } from '@shared/types';

/**
 * Pagination configuration
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  ITEMS_PER_PAGE: 5,
  DEBOUNCE_DELAY: 300, // milliseconds
} as const;

/**
 * Tab configuration for meetings list
 */
export const MEETING_TABS: TabItem[] = [
  {
    id: 'draft',
    label: 'مسودة',
  },
  {
    id: 'under-review',
    label: 'قيد المراجعة',
  },
  {
    id: 'scheduled',
    label: 'مجدول',
  },
  {
    id: 'returned-scheduling',
    label: 'معاد من مسؤول الجدولة',
  },
  {
    id: 'returned-content',
    label: 'معاد من مسؤول المحتوى',
  },
];

/**
 * Map tab ID to API status
 */
export const TAB_STATUS_MAP: Record<string, MeetingStatus | string | undefined> = {
  'draft': MeetingStatus.DRAFT,
  'under-review': MeetingStatus.UNDER_REVIEW,
  'scheduled': MeetingStatus.SCHEDULED,
  'returned-scheduling': 'RETURNED_FROM_SCHEDULING_MANAGER',
  'returned-content': 'RETURNED_FROM_CONTENT_MANAGER',
};

/**
 * Default tab ID
 */
export const DEFAULT_TAB = 'draft';

/**
 * Page title and description
 */
export const PAGE_INFO = {
  title: 'قائمة الاجتماعات',
  description: 'يمكنك الاطلاع على الاجتماعات التي قمت بإنشائها.',
} as const;
