import { TabItem } from "@/modules/shared";

// Tab ids used in code; labels match UC02 detail tabs for consistency
export enum MeetingPreviewTabs {
  MEETING_PREVIEW = 'meeting-info',
  REQUEST_INFO = 'request-info',
  INVITEES = 'attendees',
  CONTENT = 'content',
  NOTES = 'request-notes',
}

export const MEETING_PREVIEW_TABS: TabItem[] = [
  { id: MeetingPreviewTabs.REQUEST_INFO, label: 'معلومات الطلب' },
  { id: MeetingPreviewTabs.MEETING_PREVIEW, label: 'معلومات الاجتماع' },
  { id: MeetingPreviewTabs.CONTENT, label: 'المحتوى' },
  { id: MeetingPreviewTabs.INVITEES, label: 'قائمة المدعوين' },
  { id: MeetingPreviewTabs.NOTES, label: 'الملاحظات على الطلب' },
];