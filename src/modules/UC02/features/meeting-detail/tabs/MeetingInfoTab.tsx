/**
 * Meeting info tab – uses the new shared MeetingInfoView feature.
 * Maps raw meeting data via the shared mapper and renders read-only.
 */
import { useMemo } from 'react';
import { MeetingInfoView, mapMeetingToInfo } from '@/modules/shared/features/meeting-info';
import type { MapMeetingInfoOptions, RawMeetingForInfo } from '@/modules/shared/features/meeting-info';

export interface MeetingInfoTabProps {
  meeting: RawMeetingForInfo | null | undefined;
  /** Extra fields for UC02 (sequential meeting, etc.) */
  extraFields?: MapMeetingInfoOptions['extraFields'];
  /** Optional overrides from schedule form */
  channelOverride?: string;
  locationOverride?: string;
  notesOverride?: string;
  /** Show skeleton overlay while data is refreshing */
  isRefreshing?: boolean;
}

function MeetingInfoSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto pb-16 animate-pulse" dir="rtl">
      {/* Header skeleton */}
      <div className="flex items-start justify-end gap-3" dir="ltr">
        <div className="text-right space-y-2">
          <div className="h-5 w-40 bg-muted rounded-lg" />
          <div className="h-4 w-56 bg-muted/60 rounded-lg" />
        </div>
        <div className="w-11 h-11 rounded-xl bg-muted" />
      </div>

      {/* Fields grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-4 w-24 bg-muted/60 rounded" />
            <div className="h-12 w-full bg-muted/40 rounded-2xl border border-border/20" />
          </div>
        ))}
      </div>

      {/* Agenda skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-5 w-32 bg-muted rounded-lg" />
        <div className="h-32 w-full bg-muted/30 rounded-xl border border-border/20" />
      </div>
    </div>
  );
}

export function MeetingInfoTab({
  meeting,
  extraFields,
  channelOverride,
  locationOverride,
  notesOverride,
  isRefreshing = false,
}: MeetingInfoTabProps) {
  const data = useMemo(
    () => mapMeetingToInfo(meeting, { extraFields, channelOverride, locationOverride, notesOverride }),
    [meeting, extraFields, channelOverride, locationOverride, notesOverride],
  );

  if (isRefreshing) {
    return <MeetingInfoSkeleton />;
  }

  return <MeetingInfoView data={data} />;
}
