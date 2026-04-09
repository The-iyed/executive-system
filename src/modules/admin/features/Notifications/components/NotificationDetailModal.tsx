import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/lib/ui/components/dialog';
import { Button } from '@/lib/ui/components/button';
import { StatusBadge } from '@/modules/shared/components/status-badge';
import { RefreshCw, Clock, User, Mail, AlertTriangle } from 'lucide-react';
import { useNotificationDetail, useRetryNotification } from '../hooks/useNotifications';
import { NotificationStatus } from '../types';

interface NotificationDetailModalProps {
  notificationId: string | null;
  open: boolean;
  onClose: () => void;
}

const statusLabelMap: Record<NotificationStatus, string> = {
  [NotificationStatus.PENDING]: 'قيد الإرسال',
  [NotificationStatus.SENT]: 'مرسل',
  [NotificationStatus.FAILED]: 'فشل',
};

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notificationId,
  open,
  onClose,
}) => {
  const { data: notification, isLoading } = useNotificationDetail(notificationId);
  const retryMutation = useRetryNotification();

  const formattedCreated = notification?.created_at
    ? new Date(notification.created_at).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const formattedSent = notification?.sent_at
    ? new Date(notification.sent_at).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" dir="rtl">
        {isLoading ? (
          <div className="space-y-4 py-8">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-20 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : notification ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-base font-bold">
                  {notification.title}
                </DialogTitle>
                <StatusBadge
                  status={notification.status}
                  label={statusLabelMap[notification.status] ?? notification.status}
                />
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Recipient */}
              <div className="space-y-1.5">
                {notification.recipient_name && (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{notification.recipient_name}</span>
                  </div>
                )}
                {notification.recipient_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{notification.recipient_email}</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {notification.body}
                </p>
              </div>

              {/* Timestamps */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  تاريخ الإنشاء: {formattedCreated}
                </span>
                {formattedSent && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    تاريخ الإرسال: {formattedSent}
                  </span>
                )}
              </div>

              {/* Error message */}
              {notification.status === NotificationStatus.FAILED && notification.error_message && (
                <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">{notification.error_message}</p>
                </div>
              )}

              {/* Retry */}
              {notification.status === NotificationStatus.FAILED && (
                <Button
                  onClick={() => retryMutation.mutate(notification.id)}
                  disabled={retryMutation.isPending}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                  {retryMutation.isPending ? 'جاري إعادة الإرسال...' : 'إعادة الإرسال'}
                </Button>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
