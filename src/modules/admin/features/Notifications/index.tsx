import React, { useState, useMemo } from 'react';
import { Bell, Inbox } from 'lucide-react';
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
  PaginationEllipsis,
} from '@/lib/ui/components/pagination';

function getVisiblePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [];
  pages.push(1);
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

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
  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages]);

  const pageSize = 10;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-5 p-6" dir="rtl">
      {/* Header + Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#048F86] to-[#0BB5AA] shadow-md">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">الإشعارات المرسلة</h1>
            <p className="text-sm text-muted-foreground">{total} إشعار</p>
          </div>
        </div>
        <NotificationFilters
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {/* Grid Container */}
      <div className="rounded-2xl border-2 border-border/40 bg-card shadow-sm overflow-hidden">
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/30 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                    <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-sm font-medium">لا توجد إشعارات</p>
              <p className="text-xs text-muted-foreground/70 mt-1">لم يتم العثور على أي إشعارات مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={setSelectedId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border/30 px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              عرض {from}–{to} من {total}
            </span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  />
                </PaginationItem>
                {visiblePages.map((p, idx) =>
                  p === 'ellipsis' ? (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
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
