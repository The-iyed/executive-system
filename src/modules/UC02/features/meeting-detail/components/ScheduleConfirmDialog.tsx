import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/lib/ui';
import { formatDateArabic, MeetingChannelLabels } from '@/modules/shared';

interface ScheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string | null;
  endDate: string | null;
  meetingChannel: string;
  scheduleFormChannel: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function ScheduleConfirmDialog({
  open, onOpenChange, startDate, endDate, meetingChannel, scheduleFormChannel, onConfirm, isPending,
}: ScheduleConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader><DialogTitle className="text-right">تأكيد الجدولة</DialogTitle></DialogHeader>
        <div className="py-4">
          <div className="flex flex-col gap-2 text-sm text-foreground">
            <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">البداية</span><span>{startDate ? formatDateArabic(startDate) : '—'}</span></div>
            <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">النهاية</span><span>{endDate ? formatDateArabic(endDate) : '—'}</span></div>
            <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">القناة</span><span>{MeetingChannelLabels[meetingChannel] ?? MeetingChannelLabels[scheduleFormChannel] ?? '—'}</span></div>
          </div>
        </div>
        <DialogFooter className="flex-row-reverse gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
          <button type="button" disabled={isPending} onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">
            {isPending ? 'جاري الجدولة...' : 'تأكيد الجدولة'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
