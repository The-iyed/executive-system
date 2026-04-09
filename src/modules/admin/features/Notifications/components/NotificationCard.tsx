import React from 'react';
import { Clock, Mail, Phone, FileText } from 'lucide-react';
import { StatusBadge } from '@/modules/shared/components/status-badge';
import type { SentNotification } from '../types';
import { NotificationStatus } from '../types';

interface NotificationCardProps {
  notification: SentNotification;
  onClick: (id: string) => void;
}

const statusLabelMap: Record<NotificationStatus, string> = {
  [NotificationStatus.PENDING]: 'قيد الإرسال',
  [NotificationStatus.SENT]: 'مرسل',
  [NotificationStatus.FAILED]: 'فشل',
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
      className="w-full text-right rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {notification.subject}
            </h3>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              <FileText className="w-3 h-3" />
              {typeLabel[notification.notification_type] ?? notification.notification_type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {notification.body}
          </p>
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
        <StatusBadge
          status={notification.status}
          label={statusLabelMap[notification.status] ?? notification.status}
        />
      </div>
    </button>
  );
};
