import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/lib/ui';
import { formatDateTimeArabic, MeetingChannelLabels } from '@/modules/shared';
import { CalendarClock, MapPin, Monitor, CheckCircle2, FileCheck, ClipboardList } from 'lucide-react';

interface ScheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string | null;
  endDate: string | null;
  meetingChannel: string;
  scheduleFormChannel: string;
  isPreliminaryBooking: boolean;
  isDataComplete: boolean;
  location: string;
  onConfirm: () => void;
  isPending: boolean;
  validationError?: string | null;
  notes: string;
  onNotesChange: (v: string) => void;
  onPreliminaryBookingChange: (v: boolean) => void;
  onDataCompleteChange: (v: boolean) => void;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[13px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-[13px] font-semibold text-foreground">{value || '—'}</span>
    </div>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`group relative flex flex-col items-center gap-1.5 flex-1 px-4 py-3.5 rounded-xl text-center transition-all duration-200 cursor-pointer select-none border ${
        checked
          ? 'bg-primary/8 border-primary/25 shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]'
          : 'bg-muted/20 border-border/60 hover:bg-muted/40 hover:border-border'
      }`}
    >
      {/* Checkbox */}
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-md border-[1.5px] transition-all duration-200 ${
          checked
            ? 'bg-primary border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]'
            : 'bg-background border-muted-foreground/25 group-hover:border-muted-foreground/40'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6l2.5 2.5 4.5-5" />
          </svg>
        )}
      </span>
      <span className={`text-[13px] font-bold transition-colors ${checked ? 'text-primary' : 'text-foreground'}`}>
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground leading-tight">{description}</span>
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
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-right text-[17px] font-bold text-foreground">تأكيد الجدولة</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground mt-1 text-right">راجع تفاصيل الاجتماع وأكمل إعدادات الجدولة</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
          {/* Meeting summary */}
          <div className="rounded-xl border border-border/50 bg-background px-4">
            <InfoRow icon={<CalendarClock className="w-4 h-4" />} label="البداية" value={startDate ? formatDateTimeArabic(startDate) : null} />
            <InfoRow icon={<CalendarClock className="w-4 h-4" />} label="النهاية" value={endDate ? formatDateTimeArabic(endDate) : null} />
            <InfoRow icon={<Monitor className="w-4 h-4" />} label="القناة" value={channelLabel} />
            {location && <InfoRow icon={<MapPin className="w-4 h-4" />} label="الموقع" value={location} />}
          </div>

          {/* Scheduling options */}
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              إعدادات الجدولة
            </span>
            <div className="flex items-stretch gap-2.5">
              <ToggleCard
                label="مبدئي"
                description="اجتماع بدون محضر رسمي"
                checked={!requiresProtocol}
                onChange={(v) => onRequiresProtocolChange(!v)}
              />
              <ToggleCard
                label="البيانات مكتملة"
                description="جميع المعلومات المطلوبة متوفرة"
                checked={isDataComplete}
                onChange={onDataCompleteChange}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-muted-foreground" />
              ملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="أضف ملاحظات الجدولة (اختياري)..."
              className="w-full min-h-[80px] rounded-xl border border-border/60 bg-background px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none transition-all"
              dir="rtl"
            />
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-destructive/8 border border-destructive/20">
              <p className="text-[13px] text-destructive text-right font-medium">{validationError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/20 flex flex-row-reverse items-center gap-2.5">
          <button
            type="button"
            disabled={isPending || !!validationError}
            onClick={onConfirm}
            className="px-6 py-2.5 text-[13px] font-bold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isPending ? 'جاري الجدولة...' : 'تأكيد الجدولة'}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 text-[13px] font-medium text-muted-foreground bg-background border border-border/60 rounded-xl hover:bg-muted/40 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
