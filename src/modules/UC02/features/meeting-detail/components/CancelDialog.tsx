import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Textarea,
} from '@/lib/ui';

interface CancelForm {
  reason: string;
  notes: string;
}

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CancelForm;
  onFormChange: React.Dispatch<React.SetStateAction<CancelForm>>;
  onSubmit: (data: { reason?: string; notes?: string }) => void;
  isPending: boolean;
}

export function CancelDialog({ open, onOpenChange, form, onFormChange, onSubmit, isPending }: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader><DialogTitle className="text-right">إلغاء الاجتماع</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ reason: form.reason.trim() || undefined, notes: form.notes.trim() || undefined }); }}>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground text-right">سبب الإلغاء</label>
              <Input type="text" value={form.reason} onChange={(e) => onFormChange((p) => ({ ...p, reason: e.target.value }))} placeholder="سبب إلغاء الاجتماع" className="w-full text-right" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground text-right">ملاحظات إضافية</label>
              <Textarea value={form.notes} onChange={(e: any) => onFormChange((p) => ({ ...p, notes: e.target.value }))} placeholder="تفاصيل إضافية" className="w-full min-h-[100px] text-right" />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button type="button" onClick={() => { onOpenChange(false); onFormChange({ reason: '', notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">تراجع</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">{isPending ? 'جاري الإلغاء...' : 'إلغاء الاجتماع'}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
