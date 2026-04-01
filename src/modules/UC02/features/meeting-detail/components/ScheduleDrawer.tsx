import React from 'react';
import {
  Drawer, FormField, FormSwitch, FormTextArea,
} from '@/modules/shared';
import {
  DateTimePicker, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/lib/ui';

interface ScheduleForm {
  scheduled_at: string;
  scheduled_end_at: string;
  meeting_channel: string;
  is_preliminary_booking: boolean;
  is_data_complete: boolean;
  notes: string;
}

interface ScheduleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ScheduleForm;
  onFormChange: React.Dispatch<React.SetStateAction<ScheduleForm>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  validationError: string | null;
  initialForm: ScheduleForm;
}

export function ScheduleDrawer({
  open, onOpenChange, form, onFormChange, onSubmit, isPending, validationError, initialForm,
}: ScheduleDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="text-right">جدولة الاجتماع</span>}
      side="left"
      width={500}
      bodyClassName="dir-rtl"
      footer={
        <div className="flex flex-row-reverse gap-2">
          <button type="button" onClick={() => { onOpenChange(false); onFormChange(initialForm); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
          <button type="submit" form="schedule-meeting-form" disabled={!form.scheduled_at || !form.scheduled_end_at || isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{isPending ? 'جاري التحميل...' : 'جدولة'}</button>
        </div>
      }
    >
      <form id="schedule-meeting-form" onSubmit={onSubmit} className="flex flex-col gap-6">
        {validationError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-right text-sm text-red-600">{validationError}</p></div>}
        <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-foreground text-right">تاريخ ووقت البداية <span className="text-red-500">*</span></label>
            <DateTimePicker
              value={form.scheduled_at ? new Date(form.scheduled_at).toISOString() : undefined}
              onChange={(iso) => {
                const d = new Date(iso);
                const dtl = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                onFormChange((p) => ({
                  ...p, scheduled_at: dtl,
                  ...((!p.scheduled_end_at || new Date(p.scheduled_end_at) < d) ? {
                    scheduled_end_at: (() => { const e = new Date(d.getTime()+3600000); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,'0')}-${String(e.getDate()).padStart(2,'0')}T${String(e.getHours()).padStart(2,'0')}:${String(e.getMinutes()).padStart(2,'0')}`; })()
                  } : {})
                }));
              }}
              placeholder="اختر تاريخ ووقت البداية"
              className="w-full"
              required
              minDate={(() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-foreground text-right">تاريخ ووقت النهاية <span className="text-red-500">*</span></label>
            <DateTimePicker
              value={form.scheduled_end_at ? new Date(form.scheduled_end_at).toISOString() : undefined}
              onChange={(iso) => {
                const d = new Date(iso);
                const dtl = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                onFormChange((p) => ({ ...p, scheduled_end_at: dtl }));
              }}
              placeholder="اختر تاريخ ووقت النهاية"
              className="w-full"
              required
              minDate={form.scheduled_at ? new Date(form.scheduled_at) : undefined}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-2">
          <label className="text-[14px] font-medium text-foreground text-right">قناة الاجتماع <span className="text-red-500">*</span></label>
          <Select value={form.meeting_channel} onValueChange={(v) => onFormChange((p) => ({ ...p, meeting_channel: v as any }))}>
            <SelectTrigger className="w-full h-11 bg-background border border-border rounded-lg text-right flex-row-reverse"><SelectValue /></SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="PHYSICAL">حضوري</SelectItem>
              <SelectItem value="VIRTUAL">عن بُعد</SelectItem>
              <SelectItem value="HYBRID">مختلط</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-4">
          <FormField label="مبدئي" className="w-full max-w-none h-auto"><FormSwitch checked={form.is_preliminary_booking} onCheckedChange={(c) => onFormChange((p) => ({ ...p, is_preliminary_booking: c }))} /></FormField>
          <FormField label="البيانات مكتملة" className="w-full max-w-none h-auto"><FormSwitch checked={form.is_data_complete} onCheckedChange={(c) => onFormChange((p) => ({ ...p, is_data_complete: c }))} /></FormField>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <FormTextArea label="ملاحظات" value={form.notes} onChange={(e: any) => onFormChange((p) => ({ ...p, notes: e.target.value }))} placeholder="Meeting scheduled successfully" containerClassName="!px-0 !mx-0" fullWidth={false} />
        </div>
      </form>
    </Drawer>
  );
}
