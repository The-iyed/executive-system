/**
 * UC05 Return Request modal – إعادة الطلب لمقدم الطلب.
 */
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Textarea,
} from '@/lib/ui';

export interface ReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnNotes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function ReturnModal({
  open, onOpenChange, returnNotes, onNotesChange, onSubmit, isPending,
}: ReturnModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">إعادة الطلب لمقدم الطلب</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">الملاحظات *</label>
            <Textarea
              value={returnNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="أدخل الملاحظات...."
              className="min-h-[150px] resize-none"
              dir="rtl"
            />
          </div>
        </div>
        <DialogFooter className="flex-row-reverse gap-2">
          <button
            onClick={onSubmit}
            disabled={isPending || !returnNotes.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'جاري الإرسال...' : 'إرسال'}
          </button>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
