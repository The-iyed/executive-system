/**
 * UC05 Notes tab – thin wrapper around the shared RequestNotesView.
 */
import { RequestNotesView, mapContentRequestToRequestNotes } from '@/modules/shared/features/request-notes';

export interface NotesTabProps {
  schedulingContentNote: string;
}

export function NotesTab({ schedulingContentNote }: NotesTabProps) {
  const data = mapContentRequestToRequestNotes(schedulingContentNote);
  return (
    <RequestNotesView
      data={data}
      title="الملاحظات"
      emptyTitle="لا توجد ملاحظات على المحتوى"
      emptyDescription="لم يتم إضافة ملاحظات من مسؤول الجدولة على المحتوى بعد"
      className="max-w-[900px] mx-auto"
    />
  );
}
