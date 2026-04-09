export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface SentNotification {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  recipient_name?: string;
  recipient_email?: string;
  created_at: string;
  sent_at?: string;
  error_message?: string;
}

export interface NotificationDetail extends SentNotification {
  payload?: Record<string, unknown>;
}

export interface PaginatedNotificationsResponse {
  items: SentNotification[];
  total: number;
}
