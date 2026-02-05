import { TabItem } from "@shared";


export enum MeetingPreviewTabs {
  MEETING_PREVIEW = 'عرض الاجتماع',
  REQUEST_INFO = 'معلومات الطلب',
  INVITEES = 'قائمة المدعوين',
  CONTENT = 'المحتوى',
  NOTES = 'الملاحظات',
}

export const MEETING_PREVIEW_TABS: TabItem[] = [
  { id: MeetingPreviewTabs.REQUEST_INFO, label: MeetingPreviewTabs.REQUEST_INFO },
  { id: MeetingPreviewTabs.MEETING_PREVIEW, label: MeetingPreviewTabs.MEETING_PREVIEW },
  { id: MeetingPreviewTabs.CONTENT, label: MeetingPreviewTabs.CONTENT },
  { id: MeetingPreviewTabs.INVITEES, label: MeetingPreviewTabs.INVITEES },
  { id: MeetingPreviewTabs.NOTES, label: MeetingPreviewTabs.NOTES },
];