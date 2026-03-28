import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Button,
} from '@/lib/ui';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  loadingLabel,
  onConfirm,
  isLoading = false,
  variant = 'danger',
}) => {
  const confirmClassName =
    variant === 'danger'
      ? 'min-w-[100px] bg-destructive hover:bg-destructive/90 text-destructive-foreground'
      : 'min-w-[100px]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px] rounded-xl border border-border bg-background shadow-xl"
        dir="rtl"
      >
        <DialogHeader className="text-right gap-2">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-right text-base text-muted-foreground pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 justify-start sm:justify-start mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-w-[100px]"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={confirmClassName}
            disabled={isLoading}
          >
            {isLoading && loadingLabel ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
