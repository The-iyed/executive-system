import axiosInstance from '@/modules/auth/utils/axios';
import type { PaginatedNotificationsResponse, NotificationDetail } from './types';

export async function fetchNotifications(params: Record<string, any>): Promise<PaginatedNotificationsResponse> {
  const { data } = await axiosInstance.get('/api/v1/admin/sent-notifications', { params });
  return data;
}

export async function fetchNotificationDetail(id: string): Promise<NotificationDetail> {
  const { data } = await axiosInstance.get(`/api/v1/admin/sent-notifications/${id}`);
  return data;
}

export async function retryNotification(id: string): Promise<void> {
  await axiosInstance.post(`/api/v1/admin/sent-notifications/${id}/retry`);
}
