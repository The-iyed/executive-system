import type { Step2FormData } from '../schemas/step2.schema';
import type { DraftApiResponse } from '../../../data/draftApi';
import type { UserApiResponse } from '../../../data/usersApi';
import { AttendanceMechanism } from '@shared/types';

/**
 * Form data structure for an invitee
 */
export type InviteeFormData = Step2FormData['invitees'][number];

/**
 * Invitee from draft API response
 */
type DraftInvitee = NonNullable<DraftApiResponse['invitees']>[number];

/**
 * Maps an invitee from draft API response to form data format
 * 
 * @param invitee - Invitee from draft API response
 * @returns Form data for the invitee
 */
export const mapInviteeToFormData = (invitee: DraftInvitee): InviteeFormData => {
  // Convert null to undefined for user_id to match schema type
  const userId = invitee.user_id ?? undefined;
  const hasUserId = !!userId;
  
  // System user (has user_id)
  if (hasUserId) {
    return {
      id: invitee.id,
      name: invitee.external_name || '', // Will be populated from user data if available
      position: invitee.position || '', // Use position from invitee if available
      mobile: invitee.mobile || '', // Use mobile from invitee if available
      email: invitee.external_email || '', // Will be populated from user data if available
      is_required: invitee.is_required || false,
      user_id: userId, // Already converted null to undefined
      username: undefined, // Will be populated from user data if available
      disabled: true, // System users have disabled fields
      attendance_mechanism:
        (invitee.attendance_mechanism as AttendanceMechanism | null | undefined) ?? AttendanceMechanism.PHYSICAL,
    };
  }
  
  // External/Guest user (no user_id)
  return {
    id: invitee.id,
    name: invitee.external_name || '',
    position: invitee.position || '',
    mobile: invitee.mobile || '',
    email: invitee.external_email || '',
    is_required: invitee.is_required || false,
    user_id: undefined,
    username: undefined,
    disabled: false, // External users have editable fields
    attendance_mechanism:
      (invitee.attendance_mechanism as AttendanceMechanism | null | undefined) ?? AttendanceMechanism.PHYSICAL,
  };
};

/**
 * Maps a user from users API response to form data format
 * Used when adding a new system user to the invitees list
 * 
 * @param user - User from users API response
 * @returns Form data for the user as an invitee
 */
export const mapUserToFormData = (user: UserApiResponse): Omit<InviteeFormData, 'id'> => {
  // Construct full name from first_name and last_name
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ') || user.username || '';
  
  return {
    name: '', // Not required for system users (will show username)
    position: user.position || '',
    mobile: user.phone_number || '',
    email: user.email || '',
    is_required: false,
    user_id: user.id,
    username: user.username || fullName,
    disabled: true, // System users have disabled fields
    attendance_mechanism:user.attendance_mechanism ?? AttendanceMechanism.PHYSICAL,
  };
};

/**
 * Maps multiple invitees from draft API response to form data format
 * 
 * @param invitees - Array of invitees from draft API response
 * @returns Array of form data for invitees
 */
export const mapInviteesToFormData = (
  invitees: DraftApiResponse['invitees']
): InviteeFormData[] => {
  if (!invitees || invitees.length === 0) {
    return [];
  }
  
  return invitees.map(mapInviteeToFormData);
};

/**
 * Enriches form data with user details from users API
 * Used to populate missing fields for system users
 * 
 * @param invitee - Invitee form data
 * @param user - User from users API response
 * @returns Enriched invitee form data
 */
export const enrichInviteeWithUserData = (
  invitee: InviteeFormData,
  user: UserApiResponse
): InviteeFormData => {
  // Only enrich if this is a system user and the user_id matches
  if (!invitee.user_id || invitee.user_id !== user.id) {
    return invitee;
  }
  
  // Construct full name from first_name and last_name
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ') || user.username || '';
  
  // Update only missing or empty fields
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
