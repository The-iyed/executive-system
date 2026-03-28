import React from 'react';

interface MeetingListSkeletonProps {
  count?: number;
}

export const MeetingListSkeleton: React.FC<MeetingListSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-[1640px]:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border animate-pulse"
          style={{
            background: 'var(--color-base-white)',
            borderColor: 'var(--color-base-gray-200)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="h-3 w-20 rounded-md" style={{ background: 'var(--color-base-gray-200)' }} />
            <div className="h-6 w-24 rounded-full" style={{ background: 'var(--color-base-gray-200)' }} />
          </div>
          {/* Title */}
          <div className="px-5 pb-2 space-y-2">
            <div className="h-4 w-3/4 rounded-md" style={{ background: 'var(--color-base-gray-200)' }} />
            <div className="h-4 w-1/2 rounded-md" style={{ background: 'var(--color-base-gray-100)' }} />
          </div>
          {/* Tags */}
          <div className="flex items-center gap-3 px-5 py-2">
            <div className="h-4 w-28 rounded-md" style={{ background: 'var(--color-base-gray-100)' }} />
            <div className="h-5 w-20 rounded-full" style={{ background: 'var(--color-base-gray-100)' }} />
          </div>
          {/* Footer */}
          <div
            className="flex items-center gap-3 px-5 py-3"
            style={{
              background: 'var(--color-base-gray-50)',
              borderTop: '1px solid var(--color-base-gray-100)',
            }}
          >
            <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-base-gray-200)' }} />
            <div className="space-y-1">
              <div className="h-2.5 w-14 rounded" style={{ background: 'var(--color-base-gray-200)' }} />
              <div className="h-3 w-24 rounded" style={{ background: 'var(--color-base-gray-200)' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
