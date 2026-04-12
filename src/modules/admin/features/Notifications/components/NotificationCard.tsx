import React from 'react';
import { Mail, Phone, FileText } from 'lucide-react';
import { StatusBadge } from '@/modules/shared/components/status-badge';
import type { SentNotification } from '../types';
import { NotificationStatus } from '../types';
import { cn } from '@/lib/ui/lib/utils';
import { formatTimeAgoArabic } from '@/modules/shared/utils/format';

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
  const recipient = notification.recipient_email || notification.recipient_phone || '—';
  const RecipientIcon = notification.notification_type === 'SMS' ? Phone : Mail;

  return (
    <button
      onClick={() => onClick(notification.id)}
      className={cn(
        'w-full text-right rounded-xl border border-border/30 p-4',
        'transition-all duration-200 hover:shadow-md hover:border-border/60 hover:bg-muted/20',
        'focus:outline-none focus:ring-2 focus:ring-primary/20'
      )}
    >
      {/* Row 1: Status dot + Subject + Badge */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            statusDotColor[notification.status] ?? 'bg-muted'
          )}
        />
        <h3 className="text-sm font-bold text-foreground truncate flex-1">
          {notification.subject}
        </h3>
        <StatusBadge
          status={notification.status}
          label={statusLabelMap[notification.status] ?? notification.status}
        />
      </div>

      {/* Row 2: Type badge + Recipient */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          <FileText className="w-3 h-3" />
          {typeLabel[notification.notification_type] ?? notification.notification_type}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
          <RecipientIcon className="w-3 h-3 shrink-0" />
          {recipient}
        </span>
      </div>

      {/* Row 3: Relative time */}
      <p className="text-[11px] text-muted-foreground/70">
        {formatTimeAgoArabic(notification.created_at)}
      </p>
    </button>
  );
};
