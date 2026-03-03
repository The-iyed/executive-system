import { MEETING_CLASSIFICATION_OPTIONS, getInviteesTableColumns, type FormTableColumn } from '@/modules/shared';
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

/** Minister invitees table columns for UC01 (قائمة المدعوين - الوزير). */
export const MINISTER_ATTENDEES_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'w-14 shrink-0' },
  { id: 'external_name', header: 'الإسم', type: 'text', placeholder: 'الإسم', width: 'w-[260px]' },
  { id: 'position', header: 'المنصب', type: 'text', placeholder: 'المنصب', width: 'w-[200px]' },
  { id: 'external_email', header: 'البريد الإلكتروني', type: 'text', placeholder: 'البريد الإلكتروني', width: 'w-[240px]' },
  { id: 'mobile', header: 'الجوال', type: 'text', placeholder: 'الجوال', width: 'w-[180px]' },
  {
    id: 'attendance_channel',
    header: 'آلية الحضور',
    type: 'select',
    selectOptions: [
      { value: 'PHYSICAL', label: 'حضوري' },
      { value: 'REMOTE', label: 'عن بُعد' },
    ],
    placeholder: 'حضوري / عن بُعد',
    width: 'w-[180px]',
  },
  {
    id: 'is_required',
    header: 'مطلوب',
    type: 'switch',
    label: false,
    width: 'w-[120px]',
  },
  {
    id: 'justification',
    header: 'المبرر',
    type: 'text',
    placeholder: 'المبرر',
    width: 'w-[260px]',
  },
  { id: 'action', header: '', width: 'w-14 shrink-0' },
];

export const STEP_LABELS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'المحتوى' },
  { id: 'step3', label: 'قائمة المدعوين' },
];
