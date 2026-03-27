import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button,
} from '@/lib/ui';

interface DeleteDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteDraftDialog({ open, onOpenChange, onConfirm, isPending }: DeleteDraftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[425px] rounded-xl border border-border bg-background shadow-xl" dir="rtl">
        <DialogHeader className="text-right gap-2">
          <DialogTitle className="text-xl font-semibold text-foreground">حذف المسودة</DialogTitle>
          <DialogDescription className="text-right text-base text-muted-foreground pt-1">هل أنت متأكد من حذف هذه المسودة؟</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 justify-start sm:justify-start mt-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]" disabled={isPending}>إلغاء</Button>
          <Button type="button" onClick={onConfirm} className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white" disabled={isPending}>
            {isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
