import type { CalendarViewMode } from '@/modules/shared';

export type { CalendarViewMode };

export interface SlotSelection {
  date: Date;
  time: string;
  endTime?: string;
  title?: string;
  meetingLocation?: string | null;
  meetingChannel?: string;
  meetingLink?: string | null;
  webexMeetingUniqueId?: string | null;
  meetingId?: string;
  mode: 'create' | 'edit';
  initialInvitees?: Array<Record<string, unknown>>;
}
