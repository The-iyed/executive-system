import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchNotifications, fetchNotificationDetail, retryNotification } from '../api';
import type { NotificationStatus } from '../types';

const PAGE_SIZE = 10;
const QUERY_KEY = ['admin', 'sent-notifications'];

export function useNotificationList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | null>(null);

  const skip = (page - 1) * PAGE_SIZE;

  const params: Record<string, any> = { skip, limit: PAGE_SIZE };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...QUERY_KEY, page, statusFilter],
    queryFn: () => fetchNotifications(params),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleStatusChange = useCallback((status: NotificationStatus | null) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  return {
    items,
    total,
    page,
    totalPages,
    statusFilter,
    isLoading,
    isError,
    error,
    setPage,
    setStatusFilter: handleStatusChange,
    refetch,
  };
}

export function useNotificationDetail(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => fetchNotificationDetail(id!),
    enabled: !!id,
  });
}

export function useRetryNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryNotification,
    onSuccess: () => {
      toast.success('تم إعادة إرسال الإشعار بنجاح');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => {
      toast.error('فشل في إعادة إرسال الإشعار');
    },
  });
}
