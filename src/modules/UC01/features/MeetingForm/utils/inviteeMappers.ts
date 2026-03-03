import { AttendanceMechanism } from '@/modules/shared/types';
import type { Step3InviteesFormData } from '../schemas/step3Invitees.schema';
import type { DraftApiResponse } from '../../../data/draftApi';
import type { UserApiResponse } from '../../../data/usersApi';

export type InviteeFormData = Step3InviteesFormData['invitees'][number];

type DraftInvitee = NonNullable<DraftApiResponse['invitees']>[number];

export const mapInviteeToFormData = (invitee: DraftInvitee): InviteeFormData => {
  const userId = invitee.user_id ?? undefined;
  const hasUserId = !!userId;
  
  if (hasUserId) {
    return {
      id: invitee.id,
      name: invitee.external_name || '', 
      position: invitee.position || '', 
      mobile: invitee.mobile || '', 
      email: invitee.external_email || '', 
      sector: invitee.sector ?? '',
      is_required: invitee.is_required || false,
      user_id: userId, 
      username: undefined, 
      disabled: true, 
      attendance_mechanism:
        (invitee.attendance_mechanism as AttendanceMechanism | null | undefined) ?? AttendanceMechanism.PHYSICAL,
      is_consultant: (invitee as { is_consultant?: boolean }).is_consultant ?? false,
    };
  }
  
  return {
    id: invitee.id,
    name: invitee.external_name || '',
    position: invitee.position || '',
    mobile: invitee.mobile || '',
    email: invitee.external_email || '',
    sector: invitee.sector ?? '',
    is_required: invitee.is_required || false,
    user_id: undefined,
    username: undefined,
    disabled: false,
    attendance_mechanism:
      (invitee.attendance_mechanism as AttendanceMechanism | null | undefined) ?? AttendanceMechanism.PHYSICAL,
    is_consultant: (invitee as { is_consultant?: boolean }).is_consultant ?? false,
  };
};

export const mapUserToFormData = (user: UserApiResponse): Omit<InviteeFormData, 'id'> => {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ') || user.username || '';
  
  return {
    name: '',
    position: user.position || '',
    mobile: user.phone_number || '',
    email: user.email || '',
    sector: '',
    is_required: false,
    user_id: user.id,
    username: user.username || fullName,
    disabled: true,
    attendance_mechanism:user.attendance_mechanism ?? AttendanceMechanism.PHYSICAL,
    is_consultant: false,
  };
};

export const mapInviteesToFormData = (
  invitees: DraftApiResponse['invitees']
): InviteeFormData[] => {
  if (!invitees || invitees.length === 0) {
    return [];
  }
  
  return invitees.map(mapInviteeToFormData);
};

export const enrichInviteeWithUserData = (
  invitee: InviteeFormData,
  user: UserApiResponse
): InviteeFormData => {
  if (!invitee.user_id || invitee.user_id !== user.id) {
    return invitee;
  }
  
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ') || user.username || '';
  
  const currentUsername = invitee.username?.trim() || '';
  const currentPosition = invitee.position?.trim() || '';
  const currentMobile = invitee.mobile?.trim() || '';
  const currentEmail = invitee.email?.trim() || '';
  
  return {
    ...invitee,
    username: currentUsername || user.username || fullName,
    position: currentPosition || (user.position || ''),
    mobile: currentMobile || (user.phone_number || ''),
    email: currentEmail || (user.email || ''),
  };
};
