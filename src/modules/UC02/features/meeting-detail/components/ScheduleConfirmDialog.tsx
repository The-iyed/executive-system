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
  notes: string;
  onNotesChange: (v: string) => void;
  onRequiresProtocolChange: (v: boolean) => void;
  onDataCompleteChange: (v: boolean) => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '—'}</span>
    </div>
  );
}

function ToggleCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer select-none flex-1 justify-center ${
        checked
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
          : 'bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50'
      }`}
    >
      {label}
      <span
        className={`flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border-[1.5px] transition-all duration-200 ${
          checked
            ? 'bg-primary border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.15)]'
            : 'bg-background border-muted-foreground/30 group-hover:border-muted-foreground/50'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6l2.5 2.5 4.5-5" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function ScheduleConfirmDialog({
  open, onOpenChange, startDate, endDate, meetingChannel, scheduleFormChannel,
  requiresProtocol, isDataComplete, location, onConfirm, isPending, validationError,
  notes, onNotesChange, onRequiresProtocolChange, onDataCompleteChange,
}: ScheduleConfirmDialogProps) {
  const channelLabel = MeetingChannelLabels[meetingChannel] ?? MeetingChannelLabels[scheduleFormChannel] ?? '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-lg font-bold">تأكيد الجدولة</DialogTitle>
        </DialogHeader>

        <div className="py-2 flex flex-col gap-4">
          {/* Read-only summary */}
          <div>
            <InfoRow label="تاريخ ووقت البداية" value={startDate ? formatDateTimeArabic(startDate) : null} />
            <InfoRow label="تاريخ ووقت النهاية" value={endDate ? formatDateTimeArabic(endDate) : null} />
            <InfoRow label="قناة الاجتماع" value={channelLabel} />
            {location && <InfoRow label="الموقع" value={location} />}
          </div>

          {/* Interactive toggles */}
          <div className="flex items-center gap-2 bg-muted/40 rounded-2xl p-1.5 border border-border/40">
            <ToggleCheckbox
              label="مبدئي"
              checked={!requiresProtocol}
              onChange={(v) => onRequiresProtocolChange(!v)}
            />
            <ToggleCheckbox
              label="البيانات مكتملة"
              checked={isDataComplete}
              onChange={onDataCompleteChange}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="أضف ملاحظات الجدولة..."
              className="w-full min-h-[80px] rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
              dir="rtl"
            />
          </div>
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
