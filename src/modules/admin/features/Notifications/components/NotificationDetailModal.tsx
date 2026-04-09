import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/lib/ui/components/dialog';
import { Button } from '@/lib/ui/components/button';
import { StatusBadge } from '@/modules/shared/components/status-badge';
import { RefreshCw, Clock, Mail, Phone, FileText, AlertTriangle } from 'lucide-react';
import { useNotificationDetail, useRetryNotification } from '../hooks/useNotifications';
import { NotificationStatus } from '../types';
import { cn } from '@/lib/ui/lib/utils';

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

const statusAccent: Record<NotificationStatus, string> = {
  [NotificationStatus.SENT]: 'bg-[#027A48]',
  [NotificationStatus.PENDING]: 'bg-[#BE8E0B]',
  [NotificationStatus.FAILED]: 'bg-destructive',
};

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notificationId,
  open,
  onClose,
}) => {
  const { data: notification, isLoading } = useNotificationDetail(notificationId);
  const retryMutation = useRetryNotification();

  const formattedDate = notification?.created_at
    ? new Date(notification.created_at).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const parsedServiceBody = useMemo(() => {
    if (!notification?.service_request_body) return null;
    try {
      return JSON.parse(notification.service_request_body);
    } catch {
      return null;
    }
  }, [notification?.service_request_body]);

  const templateCode = parsedServiceBody?.code ?? null;
  const variables = parsedServiceBody?.variables ?? null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
        {/* Status accent bar */}
        {notification && (
          <div className={cn('h-1.5 w-full', statusAccent[notification.status] ?? 'bg-muted')} />
        )}

        <div className="p-6">
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
                    {notification.subject}
                  </DialogTitle>
                  <StatusBadge
                    status={notification.status}
                    label={statusLabelMap[notification.status] ?? notification.status}
                  />
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Type & Template */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <FileText className="w-3.5 h-3.5" />
                    {notification.notification_type === 'SMS' ? 'رسالة نصية' : 'بريد إلكتروني'}
                  </span>
                  {templateCode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium">
                      قالب: {templateCode}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border/30" />

                {/* Recipient */}
                <div className="space-y-1.5">
                  {notification.recipient_email && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{notification.recipient_email}</span>
                    </div>
                  )}
                  {notification.recipient_phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{notification.recipient_phone}</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {notification.body}
                  </p>
                </div>

                {/* Template variables */}
                {variables && (
                  <div className="rounded-xl border border-border/40 overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/30 border-b border-border/30">
                      <p className="text-xs font-semibold text-muted-foreground">بيانات القالب</p>
                    </div>
                    <div className="divide-y divide-border/20">
                      {variables.request_number && (
                        <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                          <span className="text-muted-foreground">رقم الطلب</span>
                          <span className="text-foreground font-medium">{variables.request_number}</span>
                        </div>
                      )}
                      {variables.meeting_title && (
                        <div className="flex items-center justify-between px-4 py-2.5 text-xs bg-muted/10">
                          <span className="text-muted-foreground">عنوان الاجتماع</span>
                          <span className="text-foreground font-medium">{variables.meeting_title}</span>
                        </div>
                      )}
                      {variables.date_and_time && (
                        <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                          <span className="text-muted-foreground">التاريخ والوقت</span>
                          <span className="text-foreground font-medium">{variables.date_and_time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  تاريخ الإنشاء: {formattedDate}
                </div>

                {/* Error */}
                {notification.status === NotificationStatus.FAILED && notification.failure_reason && (
                  <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{notification.failure_reason}</p>
                  </div>
                )}

                {/* Retry */}
                {notification.status === NotificationStatus.FAILED && (
                  <Button
                    onClick={() => retryMutation.mutate(notification.id)}
                    disabled={retryMutation.isPending}
                    className="w-full bg-gradient-to-l from-[#048F86] via-[#069E95] to-[#0BB5AA] text-white border-0 transition-all hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <RefreshCw className={cn('w-4 h-4', retryMutation.isPending && 'animate-spin')} />
                    {retryMutation.isPending ? 'جاري إعادة الإرسال...' : 'إعادة الإرسال'}
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
