import React, { useCallback } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/ui';

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
    btnBg: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    btnBg: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  primary: {
    icon: CheckCircle,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    btnBg: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    btnBg: 'bg-blue-500 hover:bg-blue-600 text-white',
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

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isLoading && !nextOpen) return;
      onOpenChange(nextOpen);
    },
    [isLoading, onOpenChange],
  );

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialogPrimitive.Portal>
        {/* Overlay */}
        <AlertDialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />

        {/* Content */}
        <AlertDialogPrimitive.Content
          dir="rtl"
          onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
          className={cn(
            'fixed left-1/2 top-1/2 z-[201] -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-2rem)] max-w-[340px]',
            'rounded-2xl bg-card p-6 text-center shadow-xl',
            'border border-border/40',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200',
          )}
        >
          {/* Icon */}
          <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${config.iconBg}`}>
            <Icon className={`size-5 ${config.iconColor}`} />
          </div>

          {/* Title */}
          <AlertDialogPrimitive.Title className="text-base font-bold text-foreground mb-1.5">
            {title}
          </AlertDialogPrimitive.Title>

          {/* Description */}
          <AlertDialogPrimitive.Description className="text-sm text-muted-foreground leading-relaxed mb-5">
            {description}
          </AlertDialogPrimitive.Description>

          {/* Actions */}
          <div className="flex items-center justify-center gap-2.5">
            <AlertDialogPrimitive.Cancel asChild>
              <button
                disabled={isLoading}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg border border-border/60',
                  'bg-background px-5 py-2 text-sm font-medium text-foreground',
                  'hover:bg-muted/50 transition-colors',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  'min-w-[80px]',
                )}
              >
                {cancelLabel}
              </button>
            </AlertDialogPrimitive.Cancel>

            <AlertDialogPrimitive.Action asChild>
              <button
                disabled={isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg',
                  'px-5 py-2 text-sm font-medium transition-colors',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  'min-w-[80px]',
                  config.btnBg,
                )}
              >
                {isLoading && loadingLabel ? loadingLabel : confirmLabel}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};
