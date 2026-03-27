import React from 'react';
import { Drawer } from '@/modules/shared';
import { Textarea } from '@/lib/ui';

interface ApproveUpdateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { notes: string };
  onFormChange: (form: { notes: string }) => void;
  onSubmit: (data: { notes?: string }) => void;
  isPending: boolean;
}

export function ApproveUpdateDrawer({ open, onOpenChange, form, onFormChange, onSubmit, isPending }: ApproveUpdateDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={(o) => { if (!o) onFormChange({ notes: '' }); onOpenChange(o); }}
      title={<span className="text-right">إعتماد التحديث</span>}
      side="left"
      width={500}
      bodyClassName="dir-rtl"
      footer={
        <div className="flex flex-row-reverse gap-2">
          <button type="button" onClick={() => { onOpenChange(false); onFormChange({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
          <button type="submit" form="approve-update-form" disabled={isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{isPending ? 'جاري الإرسال...' : 'إعتماد التحديث'}</button>
        </div>
      }
    >
      <form id="approve-update-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ notes: form.notes.trim() || undefined }); }} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground text-right">ملاحظات (اختياري)</label>
          <Textarea value={form.notes} onChange={(e: any) => onFormChange({ notes: e.target.value })} placeholder="تم اعتماد التحديث" className="w-full min-h-[100px] text-right" />
        </div>
      </form>
    </Drawer>
  );
}
