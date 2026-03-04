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
  object_guid?: string;
  username?: string;
  disabled?: boolean;
}

type DraftInvitee = NonNullable<DraftApiResponse['invitees']>[number];

export const mapInviteeToFormData = (invitee: DraftInvitee): InviteeFormData => {
  const objectGuid = (invitee as { object_guid?: string }).object_guid ?? invitee.user_id ?? undefined;
  const hasObjectGuid = !!objectGuid;

  if (hasObjectGuid) {
    return {
      id: invitee.id,
      name: invitee.external_name || '',
      position: invitee.position || '',
      mobile: invitee.mobile || '',
      email: invitee.external_email || '',
      is_required: invitee.is_required || false,
      object_guid: objectGuid,
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
    object_guid: undefined,
    username: undefined,
    disabled: false,
  };
};

export const mapUserToFormData = (user: UserApiResponse): Omit<InviteeFormData, 'id'> => {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ') || user.username || '';
  const objectGuid = (user as { object_guid?: string }).object_guid ?? user.id;

  return {
    name: '',
    position: user.position || '',
    mobile: user.phone_number || '',
    email: user.email || '',
    is_required: false,
    object_guid: objectGuid,
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
  const userObjectGuid = (user as { object_guid?: string }).object_guid ?? user.id;
  if (!invitee.object_guid || invitee.object_guid !== userObjectGuid) {
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
  const sector = (user as { sector?: string; department_name?: string }).sector
    ?? (user as { sector?: string; department_name?: string }).department_name
    ?? '';
  const objectGuid = (user as { object_guid?: string }).object_guid ?? user.id;
  return {
    id: options.id ?? nanoid(),
    full_name: fullName,
    position_title: user.position ?? '',
    mobile_number: user.phone_number ?? '',
    sector,
    email: user.email ?? '',
    attendance_mode: 'IN_PERSON',
    view_permission: false,
    is_consultant: false,
    ...(options.isOwner && { isOwner: true }),
    _objectGuid: objectGuid,
  } as InviteeFormRow;
};

/** Step3: create empty invitee form row (for add row). */
export const createEmptyStep3InviteeRow = (): InviteeFormRow => ({
  id: nanoid(),
  full_name: '',
  position_title: '',
  mobile_number: '',
  sector: '',
  email: '',
  attendance_mode: 'IN_PERSON',
  view_permission: false,
  is_consultant: false,
  isOwner: false,
});
