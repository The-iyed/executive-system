import React from 'react';
import { Drawer, MeetingStatus } from '@/modules/shared';
import { Textarea } from '@/lib/ui';

interface SendToContentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { notes: string };
  onFormChange: (form: { notes: string }) => void;
  onSubmit: (data: { notes: string; is_draft?: boolean }) => void;
  isPending: boolean;
  meetingStatus?: string;
}

export function SendToContentDrawer({ open, onOpenChange, form, onFormChange, onSubmit, isPending, meetingStatus }: SendToContentDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="text-right">إرسال للمحتوى</span>}
      side="left"
      width={500}
      bodyClassName="dir-rtl"
      footer={
        <div className="flex flex-row-reverse gap-2">
          <button type="button" onClick={() => { onOpenChange(false); onFormChange({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
          {meetingStatus !== MeetingStatus.SCHEDULED_SCHEDULING && (
            <button type="button" onClick={() => onSubmit({ notes: form.notes, is_draft: true })} disabled={isPending} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">{isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}</button>
          )}
          <button type="submit" form="send-to-content-form" disabled={isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{isPending ? 'جاري الإرسال...' : 'إرسال'}</button>
        </div>
      }
    >
      <form id="send-to-content-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ notes: form.notes }); }} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground text-right">ملاحظات</label>
          <Textarea value={form.notes} onChange={(e: any) => onFormChange({ notes: e.target.value })} placeholder="يرجى مراجعة المحتوى قبل الجدولة" className="w-full min-h-[100px] text-right" />
        </div>
      </form>
    </Drawer>
  );
}
