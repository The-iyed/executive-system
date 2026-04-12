export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export type NotificationType = 'EMAIL' | 'SMS';

export interface SentNotification {
  id: string;
  meeting_request_id: string | null;
  recipient_user_id: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  notification_type: NotificationType;
  subject: string;
  body: string;
  service_request_body: string;
  status: NotificationStatus;
  failure_reason: string | null;
  created_at: string;
}

export interface PaginatedNotificationsResponse {
  items: SentNotification[];
  total: number;
}
