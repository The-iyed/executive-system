import React from 'react';
import { X, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/ui';
import type { CalendarEventData } from '@/modules/shared';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/lib/ui/components/sheet';

interface DayMeetingsPanelProps {
  open: boolean;
  date: Date | null;
  events: CalendarEventData[];
  onClose: () => void;
  onEventClick: (event: CalendarEventData) => void;
}

const VARIANT_COLORS: Record<string, string> = {
  variant1: '#14B8A6',
  variant2: '#6366F1',
  variant3: '#F59E0B',
  variant4: '#3B82F6',
  variant5: '#8B5CF6',
  variant6: '#06B6D4',
};

function formatDateTitle(date: Date): string {
  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const DayMeetingsPanel: React.FC<DayMeetingsPanelProps> = ({
  open,
  date,
  events,
  onClose,
  onEventClick,
}) => {
  const sortedEvents = [...events].sort((a, b) => {
    const aTime = a.exactStartTime || a.startTime || '00:00';
    const bTime = b.exactStartTime || b.startTime || '00:00';
    return aTime.localeCompare(bTime);
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-[380px] sm:max-w-[400px] p-0 border-l-0 shadow-2xl">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40 bg-muted/30">
          <SheetTitle className="text-base font-bold text-foreground text-right">
            {date ? formatDateTitle(date) : 'الاجتماعات'}
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-right">
            {sortedEvents.length} اجتماع{sortedEvents.length !== 1 ? 'ات' : ''}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedEvents.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              لا توجد اجتماعات في هذا اليوم
            </div>
          ) : (
            sortedEvents.map((event) => {
              const dotColor = VARIANT_COLORS[event.variant || 'variant1'] || '#14B8A6';
              const startTime = event.exactStartTime || event.startTime || '';
              const endTime = event.exactEndTime || event.endTime || '';

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className={cn(
                    'w-full text-right rounded-xl border border-border/40 bg-card p-3.5',
                    'hover:bg-muted/50 hover:border-border/60 hover:shadow-sm',
                    'transition-all duration-150 ease-out',
                    'group cursor-pointer'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Color accent dot */}
                    <div
                      className="mt-1.5 size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-bold text-foreground truncate leading-tight">
                        {event.title || event.label || 'اجتماع'}
                      </p>
                      {(startTime || endTime) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3 shrink-0" />
                          <span dir="ltr" className="text-right">
                            {startTime}{startTime && endTime ? ' - ' : ''}{endTime}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
