import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/lib/ui';
import { fieldLabels } from '../constants';

interface EditConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changedPayload: Record<string, unknown>;
  hasChanges: boolean;
  validationError: string | null;
  updateErrorMessage: string | null;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}

export function EditConfirmDialog({
  open, onOpenChange, changedPayload, hasChanges,
  validationError, updateErrorMessage, onConfirm, onClose, isPending,
}: EditConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" dir="rtl">
        <DialogHeader><DialogTitle className="text-right">تأكيد التعديلات</DialogTitle></DialogHeader>
        <div className="py-4">
          {(validationError || updateErrorMessage) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-right text-sm text-red-600">{updateErrorMessage || validationError}</p>
            </div>
          )}
          <p className="text-right text-sm text-muted-foreground">سيتم إرسال الحقول التالية للتعديل:</p>
          <ul className="mt-3 list-disc list-inside text-right text-sm text-foreground">
            {Object.keys(changedPayload).map((k) => <li key={k}>{fieldLabels[k] || k}</li>)}
          </ul>
        </div>
        <DialogFooter className="flex-row-reverse gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-foreground bg-background hover:bg-muted transition-colors">إلغاء</button>
          <button type="button" onClick={onConfirm} disabled={!hasChanges || isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-50">
            {isPending ? 'جاري الإرسال...' : 'تأكيد الإرسال'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
