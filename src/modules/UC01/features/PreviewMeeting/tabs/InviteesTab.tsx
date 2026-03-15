import React from 'react';
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';
import { TableRow } from '@/lib/dynamic-table-form';
interface InviteesTabProps {
    invitees:TableRow[]
}

export const InviteesTab: React.FC<InviteesTabProps> = ({ invitees }) => {
  return (
    <InviteesTableForm initialInvitees={invitees} excludeColumns={["access_permission", "is_consultant"]} mode='view' viewLayout="cards"  />
  );
};