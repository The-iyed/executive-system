import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationFilters } from './components/NotificationFilters';
import { NotificationCard } from './components/NotificationCard';
import { NotificationDetailModal } from './components/NotificationDetailModal';
import { useNotificationList } from './hooks/useNotifications';
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

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">الإشعارات المرسلة</h1>
          <p className="text-sm text-muted-foreground">
            {total} إشعار
          </p>
        </div>
      </div>

      {/* Filters */}
      <NotificationFilters
        activeStatus={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse">
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-1/3 bg-muted rounded" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">لا توجد إشعارات</p>
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

      {/* Pagination */}
      {totalPages > 1 && (
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
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p)}
                >
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
      )}

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
