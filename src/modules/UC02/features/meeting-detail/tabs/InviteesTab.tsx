/**
 * Invitees tab – thin wrapper for non-schedule-officer view.
 */
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';

export interface InviteesTabProps {
  invitees: any;
}

export function InviteesTab({ invitees }: InviteesTabProps) {
  return (
    <div className="w-full max-w-4xl mx-auto" dir="rtl">
      <InviteesTableForm initialInvitees={invitees} mode="view" />
    </div>
  );
}
