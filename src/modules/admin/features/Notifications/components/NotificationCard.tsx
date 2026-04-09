import React from 'react';
import { Clock, Mail, Phone, FileText } from 'lucide-react';
import { StatusBadge } from '@/modules/shared/components/status-badge';
import type { SentNotification } from '../types';
import { NotificationStatus } from '../types';
import { cn } from '@/lib/ui/lib/utils';

interface NotificationCardProps {
  notification: SentNotification;
  onClick: (id: string) => void;
}

const statusLabelMap: Record<NotificationStatus, string> = {
  [NotificationStatus.PENDING]: 'قيد الإرسال',
  [NotificationStatus.SENT]: 'مرسل',
  [NotificationStatus.FAILED]: 'فشل',
};

const statusDotColor: Record<NotificationStatus, string> = {
  [NotificationStatus.SENT]: 'bg-[#027A48]',
  [NotificationStatus.PENDING]: 'bg-[#BE8E0B]',
  [NotificationStatus.FAILED]: 'bg-destructive',
};

const typeLabel: Record<string, string> = {
  EMAIL: 'بريد إلكتروني',
  SMS: 'رسالة نصية',
};

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onClick }) => {
  const formattedDate = notification.created_at
    ? new Date(notification.created_at).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const recipient = notification.recipient_email || notification.recipient_phone || '—';
  const RecipientIcon = notification.notification_type === 'SMS' ? Phone : Mail;

  return (
    <button
      onClick={() => onClick(notification.id)}
      className={cn(
        'w-full text-right flex items-center gap-4 px-5 py-4',
        'border-b border-border/20 last:border-b-0',
        'transition-all duration-200 hover:bg-muted/30 hover:translate-x-1',
        'focus:outline-none focus:bg-muted/30'
      )}
    >
      {/* Status dot */}
      <div
        className={cn(
          'w-2.5 h-2.5 rounded-full shrink-0',
          statusDotColor[notification.status] ?? 'bg-muted'
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Row 1: Subject + type */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {notification.subject}
          </h3>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            <FileText className="w-3 h-3" />
            {typeLabel[notification.notification_type] ?? notification.notification_type}
          </span>
        </div>

        {/* Row 2: Recipient + timestamp */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <RecipientIcon className="w-3 h-3 shrink-0" />
            {recipient}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <StatusBadge
        status={notification.status}
        label={statusLabelMap[notification.status] ?? notification.status}
      />
    </button>
  );
};
