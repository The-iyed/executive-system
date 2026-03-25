import React, { memo } from 'react';

/** Thin progress bar + dots shown while calendar is refetching */
export const SyncIndicator: React.FC = memo(() => (
  <div
    className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-col items-center gap-2"
    aria-busy
    aria-label="مزامنة التقويم"
  >
    <div className="h-[3px] w-full max-w-md overflow-hidden rounded-full bg-muted">
      <div className="minister-cal-shimmer-bar h-full w-1/3 rounded-full bg-primary" />
    </div>
    <div className="flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 shadow-sm border border-border/40">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="minister-cal-dot h-2 w-2 rounded-full bg-primary"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
));

SyncIndicator.displayName = 'SyncIndicator';
