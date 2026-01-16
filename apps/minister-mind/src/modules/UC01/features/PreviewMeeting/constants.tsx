import { TabItem } from "@shared";


export enum MeetingPreviewTabs {
    MEETING_PREVIEW = 'عرض الاجتماع',
    NOTES = 'الملاحظات',
}

export const MEETING_PREVIEW_TABS: TabItem[] = [
    {
        id: MeetingPreviewTabs.MEETING_PREVIEW,
        label: MeetingPreviewTabs.MEETING_PREVIEW,
    },
    {
        id: MeetingPreviewTabs.NOTES,
        label: MeetingPreviewTabs.NOTES,
    },
];