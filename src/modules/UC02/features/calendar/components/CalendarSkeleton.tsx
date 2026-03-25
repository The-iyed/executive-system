import React, { memo } from 'react';
import { Skeleton } from '@/lib/ui';

const DAYS = 7;
const HOURS = 12;

const SKELETON_EVENTS = [
  { day: 0, hour: 1, span: 2 },
  { day: 1, hour: 3, span: 1 },
  { day: 2, hour: 0, span: 1 },
  { day: 3, hour: 5, span: 2 },
  { day: 4, hour: 2, span: 1 },
  { day: 5, hour: 4, span: 1 },
  { day: 6, hour: 1, span: 2 },
] as const;

/** Skeleton for the calendar grid – shows while timeline events are loading */
export const CalendarSkeleton: React.FC = memo(() => (
  <div className="w-full overflow-hidden rounded-2xl border border-border/40 bg-card">
    {/* Header skeleton */}
    <div className="grid grid-cols-[repeat(7,1fr)_52px] border-b border-border/30">
      {Array.from({ length: DAYS }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center gap-1.5 py-4 border-l border-border/20 first:border-l-0"
        >
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-3 w-12 rounded-md" />
        </div>
      ))}
      <div className="flex items-center justify-center border-l border-border/20">
        <Skeleton className="h-3 w-6 rounded" />
      </div>
    </div>

    {/* Grid skeleton */}
    <div className="grid grid-cols-[repeat(7,1fr)_52px]">
      {Array.from({ length: HOURS }).map((_, hourIdx) => (
        <React.Fragment key={hourIdx}>
          {Array.from({ length: DAYS }).map((_, dayIdx) => {
            const event = SKELETON_EVENTS.find(
              (e) => e.day === dayIdx && e.hour === hourIdx,
            );
            return (
              <div
                key={dayIdx}
                className="min-h-[56px] border-b border-l border-border/15 relative"
              >
                {event && (
                  <div
                    className="absolute inset-1 rounded-lg overflow-hidden"
                    style={{ height: `${event.span * 56 - 8}px` }}
                  >
                    <Skeleton className="h-full w-full rounded-lg" />
                  </div>
                )}
              </div>
            );
          })}
          <div className="min-h-[56px] border-b border-l border-border/15 flex items-start justify-center pt-1">
            <Skeleton className="h-3 w-8 rounded" />
          </div>
        </React.Fragment>
      ))}
    </div>
  </div>
));

CalendarSkeleton.displayName = 'CalendarSkeleton';
