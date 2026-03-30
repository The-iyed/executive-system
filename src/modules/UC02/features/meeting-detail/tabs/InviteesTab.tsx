/**
 * Invitees tab – thin wrapper for non-schedule-officer view.
 */
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';

export interface InviteesTabProps {
  invitees: any;
}

export function InviteesTab({ invitees }: InviteesTabProps) {
  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full self-stretch" dir="rtl" style={{ width: '100%', minWidth: 0, flex: '1 1 0%' }}>
      <InviteesTableForm initialInvitees={invitees} mode="view" />
    </div>
  );
}
