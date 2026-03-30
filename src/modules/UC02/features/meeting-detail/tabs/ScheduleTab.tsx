/**
 * Schedule tab – قائمة المدعوين (read-only cards layout).
 * Shown only for schedule officers (UC-02).
 */
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';

export interface ScheduleTabProps {
  invitees: any;
  validationError?: string | null;
}

export function ScheduleTab({
  invitees,
  validationError,
}: ScheduleTabProps) {
  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {validationError && (
        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
          <p className="text-right text-sm text-destructive">{validationError}</p>
        </div>
      )}
      <InviteesTableForm initialInvitees={invitees} mode="view" viewLayout="cards" showAiSuggest={false} />
    </div>
  );
}
