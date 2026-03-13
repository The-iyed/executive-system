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

/** Minister invitees table columns for UC01 (قائمة المدعوين - الوزير).
 * Uses UC01 field IDs (external_email, external_name, position, mobile, attendance_channel). */
export const MINISTER_ATTENDEES_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'min-w-[60px]' },
  { id: 'external_email', header: 'البريد الإلكتروني', type: 'text', placeholder: 'البريد الإلكتروني', width: 'min-w-[220px]' },
  { id: 'external_name', header: 'الإسم', type: 'text', placeholder: 'الإسم', width: 'min-w-[180px]' },
  { id: 'position', header: 'المنصب', type: 'text', placeholder: 'المنصب', width: 'min-w-[160px]' },
  { id: 'mobile', header: 'الجوال', type: 'text', placeholder: 'الجوال', width: 'min-w-[140px]' },
  {
    id: 'attendance_channel',
    header: 'آلية الحضور',
    type: 'select',
    selectOptions: [
      { value: 'PHYSICAL', label: 'حضوري' },
      { value: 'REMOTE', label: 'عن بُعد' },
    ],
    placeholder: 'حضوري / عن بُعد',
    width: 'min-w-[150px]',
  },
  { id: 'action', header: '', width: 'w-[60px]' },
];

export const STEP_LABELS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'المحتوى' },
  { id: 'step3', label: 'المدعوون' },
];
