import {
  MEETING_CLASSIFICATION_OPTIONS,
  MEETING_CHANNEL_OPTIONS,
  MEETING_LOCATION_OPTIONS,
  MeetingLocation,
  getMeetingLocationDropdownValue,
  showMeetingLocationOtherInput,
  isPresetMeetingLocation,
  getInviteesTableColumns,
  type FormTableColumn,
} from '@/modules/shared';
import { MINISTER_INVITEES_TABLE_COLUMNS_NO_OWNER } from '@/modules/UC02/features/MeetingForm/utils/constants';
import { AttendanceMechanism } from '@/modules/shared/types';

export { MEETING_CLASSIFICATION_OPTIONS, MEETING_CHANNEL_OPTIONS, MEETING_LOCATION_OPTIONS, MeetingLocation, getMeetingLocationDropdownValue, showMeetingLocationOtherInput, isPresetMeetingLocation };

export type { MeetingLocationValue } from '@/modules/shared';

export const CONFIDENTIALITY_OPTIONS = [
  { value: 'CONFIDENTIAL', label: 'سرّي' },
  { value: 'NORMAL', label: 'عادي' },
];

export const DIRECTIVE_METHOD_OPTIONS = [
  { value: 'DIRECT_DIRECTIVE', label: 'توجيه مباشر' },
  { value: 'PREVIOUS_MEETING', label: 'اجتماع سابق' },
];

/** Shared invitees table columns (same structure as UC02 Step3 for alignment). */
export const INVITEES_TABLE_COLUMNS = getInviteesTableColumns({
  nameFieldId: 'name',
  positionFieldId: 'position',
  sectorFieldId: 'sector',
  mobileFieldId: 'mobile',
  emailFieldId: 'email',
  attendanceFieldId: 'attendance_mechanism',
  attendanceOptions: [
    { value: AttendanceMechanism.PHYSICAL, label: AttendanceMechanism.PHYSICAL },
    { value: AttendanceMechanism.VIRTUAL, label: AttendanceMechanism.VIRTUAL },
  ],
});

/** Minister invitees table columns for UC01 (قائمة المدعوين - الوزير) – reuse UC02 definition. */
export const MINISTER_ATTENDEES_COLUMNS: FormTableColumn[] = MINISTER_INVITEES_TABLE_COLUMNS_NO_OWNER;

export const STEP_LABELS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'المحتوى' },
  { id: 'step3', label: 'المدعوون' },
];
