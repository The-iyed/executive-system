import { MEETING_CLASSIFICATION_OPTIONS, getInviteesTableColumns, type FormTableColumn } from '@/modules/shared';
import { MINISTER_INVITEES_TABLE_COLUMNS_NO_OWNER } from '@/modules/UC02/features/MeetingForm/utils/constants';
import { AttendanceMechanism } from '@/modules/shared/types';

export { MEETING_CLASSIFICATION_OPTIONS };

export const CONFIDENTIALITY_OPTIONS = [
  { value: 'CONFIDENTIAL', label: 'سرّي' },
  { value: 'NORMAL', label: 'عادي' },
];

/** آلية انعقاد الاجتماع: حضوري / عن بعد — sent to API as meeting_channel */
export const MEETING_CHANNEL_OPTIONS = [
  { value: 'PHYSICAL', label: AttendanceMechanism.PHYSICAL },
  { value: 'VIRTUAL', label: AttendanceMechanism.VIRTUAL },
];

export const MeetingLocation = {
  ALIYA: 'العليا',
  GHADEER: 'الغدير',
  OTHER: 'موقع آخر',
} as const;

export type MeetingLocationValue = (typeof MeetingLocation)[keyof typeof MeetingLocation];

export const MEETING_LOCATION_OPTIONS: { value: MeetingLocationValue; label: string }[] = [
  { value: MeetingLocation.ALIYA, label: MeetingLocation.ALIYA },
  { value: MeetingLocation.GHADEER, label: MeetingLocation.GHADEER },
  { value: MeetingLocation.OTHER, label: MeetingLocation.OTHER },
];

export function isPresetMeetingLocation(value: string | undefined): value is MeetingLocationValue {
  return value === MeetingLocation.ALIYA || value === MeetingLocation.GHADEER;
}

export function getMeetingLocationDropdownValue(
  meeting_location: string | undefined,
  meeting_location_option: string | undefined
): '' | MeetingLocationValue {
  const loc = meeting_location?.trim() ?? '';
  if (loc === MeetingLocation.ALIYA || loc === MeetingLocation.GHADEER) return loc;
  if (loc !== '') return MeetingLocation.OTHER;
  return (meeting_location_option as '' | MeetingLocationValue) ?? '';
}

export function showMeetingLocationOtherInput(
  meeting_location: string | undefined,
  meeting_location_option: string | undefined
): boolean {
  const loc = meeting_location?.trim() ?? '';
  if (isPresetMeetingLocation(loc)) return false;
  if (loc !== '') return true; // custom text stored in meeting_location
  return meeting_location_option === MeetingLocation.OTHER;
}

export const DIRECTIVE_METHOD_OPTIONS = [
  { value: 'DIRECT_DIRECTIVE', label: 'توجيه مباشر' },
  { value: 'PREVIOUS_MEETING', label: 'اجتماع سابق' },
];

/** Shared invitees table columns (same structure as UC02 Step3 for alignment). */
export const INVITEES_TABLE_COLUMNS = getInviteesTableColumns({
  emailFieldId: 'email',
  nameFieldId: 'name',
  positionFieldId: 'position',
  sectorFieldId: 'sector',
  mobileFieldId: 'mobile',
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
  { id: 'step3', label: 'قائمة المدعوين' },
];
