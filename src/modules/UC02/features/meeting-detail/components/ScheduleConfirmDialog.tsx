import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/lib/ui';
import { formatDateTimeArabic, MeetingChannelLabels } from '@/modules/shared';

interface ScheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string | null;
  endDate: string | null;
  meetingChannel: string;
  scheduleFormChannel: string;
  requiresProtocol: boolean;
  isDataComplete: boolean;
  location: string;
  onConfirm: () => void;
  isPending: boolean;
  validationError?: string | null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '—'}</span>
    </div>
  );
}

export function ScheduleConfirmDialog({
  open, onOpenChange, startDate, endDate, meetingChannel, scheduleFormChannel,
  requiresProtocol, isDataComplete, location, onConfirm, isPending, validationError,
}: ScheduleConfirmDialogProps) {
  const channelLabel = MeetingChannelLabels[meetingChannel] ?? MeetingChannelLabels[scheduleFormChannel] ?? '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-lg font-bold">تأكيد الجدولة</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <InfoRow label="تاريخ ووقت البداية" value={startDate ? formatDateTimeArabic(startDate) : null} />
          <InfoRow label="تاريخ ووقت النهاية" value={endDate ? formatDateTimeArabic(endDate) : null} />
          <InfoRow label="قناة الاجتماع" value={channelLabel} />
          <InfoRow label="مبدئي" value={requiresProtocol ? 'لا' : 'نعم'} />
          <InfoRow label="البيانات مكتملة" value={isDataComplete ? 'نعم' : 'لا'} />
          {location && <InfoRow label="الموقع" value={location} />}
        </div>

        {validationError && (
          <p className="text-sm text-destructive text-right px-1">{validationError}</p>
        )}

        <DialogFooter className="flex-row-reverse gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'جاري الجدولة...' : 'تأكيد الجدولة'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
