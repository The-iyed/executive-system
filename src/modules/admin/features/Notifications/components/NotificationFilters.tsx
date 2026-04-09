import React from 'react';
import { NotificationStatus } from '../types';
import { cn } from '@/lib/ui/lib/utils';

interface NotificationFiltersProps {
  activeStatus: NotificationStatus | null;
  onStatusChange: (status: NotificationStatus | null) => void;
}

const filters: { label: string; value: NotificationStatus | null }[] = [
  { label: 'الكل', value: null },
  { label: 'قيد الإرسال', value: NotificationStatus.PENDING },
  { label: 'مرسل', value: NotificationStatus.SENT },
  { label: 'فشل', value: NotificationStatus.FAILED },
];

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  activeStatus,
  onStatusChange,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => {
        const isActive = activeStatus === filter.value;
        return (
          <button
            key={filter.value ?? 'all'}
            onClick={() => onStatusChange(filter.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
              isActive
                ? 'bg-gradient-to-l from-[#048F86] to-[#0BB5AA] text-white border-transparent shadow-sm'
                : 'bg-background text-muted-foreground border-border/50 hover:bg-muted/60'
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};
