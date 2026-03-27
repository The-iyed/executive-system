import React from 'react';
import { Drawer } from '@/modules/shared';
import { Textarea } from '@/lib/ui';

interface ReturnForInfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: (data: { notes: string }) => void;
  isPending: boolean;
  notesError: string | null;
  onNotesErrorChange: (err: string | null) => void;
}

export function ReturnForInfoDrawer({
  open, onOpenChange, notes, onNotesChange, onSubmit, isPending, notesError, onNotesErrorChange,
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
          const notesTrimmed = notes.trim();
          if (!notesTrimmed) { onNotesErrorChange('الملاحظات مطلوبة'); return; }
          onNotesErrorChange(null);
          onSubmit({ notes: notesTrimmed });
        }}
        className="flex flex-col gap-4"
        dir="rtl"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground text-right">ملاحظات <span className="text-red-500">*</span></label>
          <Textarea value={notes} onChange={(e: any) => onNotesChange(e.target.value)} placeholder="يرجى تعديل البيانات المطلوبة" className="w-full min-h-[100px] text-right" />
          {notesError && <p className="text-sm text-red-600 text-right">{notesError}</p>}
        </div>
      </form>
    </Drawer>
  );
}
