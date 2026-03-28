import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/lib/ui';

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
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  primary: {
    icon: CheckCircle,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    btnClass: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    btnClass: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
};

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

  const handleClose = () => {
    if (!isLoading) onOpenChange(false);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none" dir="rtl">
            <motion.div
              className="pointer-events-auto w-full max-w-sm rounded-2xl bg-card shadow-2xl border border-border/50 p-8 text-center"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className={`mx-auto mb-5 flex size-14 items-center justify-center rounded-full ${config.iconBg}`}>
                <Icon className={`size-6 ${config.iconColor}`} />
              </div>

              <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{description}</p>

              <div className="flex items-center gap-3 justify-center">
                <Button
                  onClick={onConfirm}
                  className={`rounded-xl px-5 ${config.btnClass}`}
                  disabled={isLoading}
                >
                  {isLoading && loadingLabel ? loadingLabel : confirmLabel}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="rounded-xl px-5"
                  disabled={isLoading}
                >
                  {cancelLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
