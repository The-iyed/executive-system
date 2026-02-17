import { nanoid } from 'nanoid';
import { UserApiResponse } from '../../../data/usersApi';
import { DraftApiResponse } from '../../../data';
import type { InviteeFormRow } from '../schemas/step3.schema';

/**
 * Form data structure for an invitee (used by draft/invitees API, not by Step 2 Presentation form).
 */
export interface InviteeFormData {
  id: string;
  name?: string;
  position?: string;
  mobile?: string;
  email?: string;
  is_required?: boolean;
  user_id?: string;
  username?: string;
  disabled?: boolean;
}

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
      is_required: invitee.is_required || false,
      user_id: userId, 
      username: undefined, 
      disabled: true, 
    };
  }
  
  return {
    id: invitee.id,
    name: invitee.external_name || '',
    position: invitee.position || '',
    mobile: invitee.mobile || '',
    email: invitee.external_email || '',
    is_required: invitee.is_required || false,
    user_id: undefined,
    username: undefined,
    disabled: false, 
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
    is_required: false,
    user_id: user.id,
    username: user.username || fullName,
    disabled: true, // System users have disabled fields
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

export const mapUserToStep3InviteeRow = (
  user: UserApiResponse,
  options: { isOwner?: boolean; id?: string } = {}
): InviteeFormRow => {
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username ||
    user.name ||
    '';
  return {
    id: options.id ?? nanoid(),
    full_name: fullName,
    position_title: user.position ?? '',
    mobile_number: user.phone_number ?? '',
    email: user.email ?? '',
    attendance_mode: 'IN_PERSON',
    view_permission: false,
    ...(options.isOwner && { isOwner: true }),
  };
};

/** Step3: create empty invitee form row (for add row). */
export const createEmptyStep3InviteeRow = (): InviteeFormRow => ({
  id: nanoid(),
  full_name: '',
  position_title: '',
  mobile_number: '',
  email: '',
  attendance_mode: 'IN_PERSON',
  view_permission: false,
});
