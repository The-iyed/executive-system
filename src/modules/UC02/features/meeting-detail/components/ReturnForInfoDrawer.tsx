import React from 'react';
import { Drawer } from '@/modules/shared';
import { Textarea } from '@/lib/ui';
import { fieldLabels, EDITABLE_FIELD_IDS } from '../constants';

interface ReturnForInfoForm {
  notes: string;
  editable_fields: Record<string, boolean>;
}

interface ReturnForInfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ReturnForInfoForm;
  onFormChange: React.Dispatch<React.SetStateAction<ReturnForInfoForm>>;
  onSubmit: (data: { notes: string; editable_fields: string[] }) => void;
  isPending: boolean;
  notesError: string | null;
  onNotesErrorChange: (err: string | null) => void;
}

export function ReturnForInfoDrawer({
  open, onOpenChange, form, onFormChange, onSubmit, isPending, notesError, onNotesErrorChange,
}: ReturnForInfoDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) onNotesErrorChange(null); }}
      title={<span className="text-right">إعادة للطلب</span>}
      side="left"
      width={500}
      footer={
        <div className="flex flex-row-reverse gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
          <button type="submit" form="return-for-info-form" disabled={isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{isPending ? 'جاري الإرسال...' : 'إعادة'}</button>
        </div>
      }
    >
      <form
        id="return-for-info-form"
        onSubmit={(e) => {
          e.preventDefault();
          const notesTrimmed = form.notes.trim();
          if (!notesTrimmed) { onNotesErrorChange('الملاحظات مطلوبة'); return; }
          onNotesErrorChange(null);
          onSubmit({
            notes: notesTrimmed,
            editable_fields: EDITABLE_FIELD_IDS.filter((fid) => form.editable_fields[fid]),
          });
        }}
        className="flex flex-col gap-4"
        dir="rtl"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground text-right">ملاحظات <span className="text-red-500">*</span></label>
          <Textarea value={form.notes} onChange={(e: any) => onFormChange((p) => ({ ...p, notes: e.target.value }))} placeholder="يرجى تعديل البيانات المطلوبة" className="w-full min-h-[100px] text-right" />
          {notesError && <p className="text-sm text-red-600 text-right">{notesError}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground text-right">الحقول المطلوب تعديلها</label>
          <div className="grid grid-cols-2 gap-2">
            {EDITABLE_FIELD_IDS.map((fid) => (
              <label key={fid} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.editable_fields[fid] ?? false} onChange={(e) => onFormChange((p) => ({ ...p, editable_fields: { ...p.editable_fields, [fid]: e.target.checked } }))} className="rounded border-border" />
                {fieldLabels[fid] || fid}
              </label>
            ))}
          </div>
        </div>
      </form>
    </Drawer>
  );
}
