import React from 'react';
import { NotificationStatus } from '../types';
import { cn } from '@/lib/ui/lib/utils';

interface NotificationFiltersProps {
  activeStatus: NotificationStatus | null;
  onStatusChange: (status: NotificationStatus | null) => void;
  counts?: { sent: number; pending: number; failed: number };
}

const filters: { label: string; value: NotificationStatus | null; countKey?: 'sent' | 'pending' | 'failed' }[] = [
  { label: 'الكل', value: null },
  { label: 'قيد الإرسال', value: NotificationStatus.PENDING, countKey: 'pending' },
  { label: 'مرسل', value: NotificationStatus.SENT, countKey: 'sent' },
  { label: 'فشل', value: NotificationStatus.FAILED, countKey: 'failed' },
];

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  activeStatus,
  onStatusChange,
  counts,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => {
        const isActive = activeStatus === filter.value;
        const count = filter.countKey && counts ? counts[filter.countKey] : null;

        return (
          <button
            key={filter.value ?? 'all'}
            onClick={() => onStatusChange(filter.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border inline-flex items-center gap-1.5',
              isActive
                ? 'bg-gradient-to-l from-[#048F86] to-[#0BB5AA] text-white border-transparent shadow-sm'
                : 'bg-background text-muted-foreground border-border/50 hover:bg-muted/60'
            )}
          >
            {filter.label}
            {count !== null && count > 0 && (
              <span
                className={cn(
                  'text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1',
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
