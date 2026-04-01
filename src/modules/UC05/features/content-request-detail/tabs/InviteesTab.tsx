/**
 * UC05 Invitees tab – wraps shared InviteesTableForm in view mode.
 */
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';
import type { TableRow } from '@/lib/dynamic-table-form';

export interface InviteesTabProps {
  invitees: TableRow[] | undefined;
}

export function InviteesTab({ invitees }: InviteesTabProps) {
  return (
    <div className="w-full max-w-4xl mx-auto" dir="rtl">
      <InviteesTableForm initialInvitees={invitees} mode="view" />
    </div>
  );
}
