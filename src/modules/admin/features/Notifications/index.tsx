import React, { useState, useMemo } from 'react';
import { Bell, Send, Clock, AlertTriangle, Inbox } from 'lucide-react';
import { NotificationFilters } from './components/NotificationFilters';
import { NotificationCard } from './components/NotificationCard';
import { NotificationDetailModal } from './components/NotificationDetailModal';
import { useNotificationList } from './hooks/useNotifications';
import { NotificationStatus } from './types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/lib/ui/components/pagination';

const NotificationsPage: React.FC = () => {
  const {
    items,
    total,
    page,
    totalPages,
    statusFilter,
    isLoading,
    setPage,
    setStatusFilter,
  } = useNotificationList();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Compute status counts from current items (approximate from loaded page)
  const statusCounts = useMemo(() => {
    const counts = { sent: 0, pending: 0, failed: 0 };
    items.forEach((n) => {
      if (n.status === NotificationStatus.SENT) counts.sent++;
      else if (n.status === NotificationStatus.PENDING) counts.pending++;
      else if (n.status === NotificationStatus.FAILED) counts.failed++;
    });
    return counts;
  }, [items]);

  const stats = [
    { label: 'مرسل', count: statusCounts.sent, icon: Send, dotClass: 'bg-[#027A48]' },
    { label: 'قيد الإرسال', count: statusCounts.pending, icon: Clock, dotClass: 'bg-[#BE8E0B]' },
    { label: 'فشل', count: statusCounts.failed, icon: AlertTriangle, dotClass: 'bg-destructive' },
  ];

  return (
    <div className="space-y-5 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#048F86] to-[#0BB5AA] shadow-md">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">الإشعارات المرسلة</h1>
          <p className="text-sm text-muted-foreground">{total} إشعار</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3.5 shadow-sm"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${s.dotClass} shrink-0`} />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-tight">{s.count}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Container */}
      <div className="rounded-2xl border-2 border-border/40 bg-card shadow-sm overflow-hidden">
        {/* Filters bar */}
        <div className="border-b border-border/30 bg-muted/20 px-5 py-3">
          <NotificationFilters
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            counts={statusCounts}
          />
        </div>

        {/* List */}
        <div>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 border-b border-border/20 last:border-b-0"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-sm font-medium">لا توجد إشعارات</p>
              <p className="text-xs text-muted-foreground/70 mt-1">لم يتم العثور على أي إشعارات مطابقة</p>
            </div>
          ) : (
            items.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={setSelectedId}
              />
            ))
          )}
        </div>

        {/* Pagination inside container */}
        {totalPages > 1 && (
          <div className="border-t border-border/30 px-5 py-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  />
                </PaginationItem>
                {pageNumbers.map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <NotificationDetailModal
        notificationId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
};

export default NotificationsPage;
