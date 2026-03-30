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
}

export function MeetingInfoTab({
  meeting,
  extraFields,
  channelOverride,
  locationOverride,
  notesOverride,
}: MeetingInfoTabProps) {
  const data = useMemo(
    () => mapMeetingToInfo(meeting, { extraFields, channelOverride, locationOverride, notesOverride }),
    [meeting, extraFields, channelOverride, locationOverride, notesOverride],
  );

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full self-stretch" dir="rtl" style={{ width: '100%', minWidth: 0, flex: '1 1 0%' }}>
      <MeetingInfoView data={data} />
    </div>
  );
}
