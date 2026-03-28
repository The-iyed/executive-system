import React, { useCallback } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/lib/ui/components/alert-dialog';

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
  variant?: 'danger' | 'primary' | 'warning' | 'info';
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    btnClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    btnClass: 'bg-warning hover:bg-warning/90 text-warning-foreground',
  },
  primary: {
    icon: CheckCircle,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    btnClass: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  info: {
    icon: Info,
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent-foreground',
    btnClass: 'bg-accent hover:bg-accent/90 text-accent-foreground',
  },
} as const;

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
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (isLoading && !nextOpen) return;
    onOpenChange(nextOpen);
  }, [isLoading, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogPortal>
        <AlertDialogOverlay className="z-[220] bg-black/70 backdrop-blur-sm" />
        <AlertDialogContent
          dir="rtl"
          className="z-[221] w-full max-w-sm rounded-2xl border border-border/50 bg-card p-8 text-center shadow-2xl"
          onEscapeKeyDown={(event) => {
            if (isLoading) event.preventDefault();
          }}
        >
          <AlertDialogHeader className="items-center gap-0 text-center">
            <div className={`mx-auto mb-5 flex size-14 items-center justify-center rounded-full ${config.iconBg}`}>
              <Icon className={`size-6 ${config.iconColor}`} />
            </div>
            <AlertDialogTitle className="mb-2 text-center text-lg font-bold text-foreground">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mb-6 text-center text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-0 flex items-center justify-center gap-3 sm:flex-row">
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
              disabled={isLoading}
              className={`m-0 rounded-xl px-5 ${config.btnClass}`}
            >
              {isLoading && loadingLabel ? loadingLabel : confirmLabel}
            </AlertDialogAction>
            <AlertDialogCancel
              disabled={isLoading}
              className="m-0 rounded-xl px-5"
            >
              {cancelLabel}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
};
