/**
 * Schedule tab – قائمة المدعوين (read-only cards layout).
 * Shown only for schedule officers (UC-02).
 */
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';

export interface ScheduleTabProps {
  invitees: any;
}

export function ScheduleTab({
  invitees,
}: ScheduleTabProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto" dir="rtl">
      <InviteesTableForm initialInvitees={invitees} mode="view" showAiSuggest={false} />
    </div>
  );
}
