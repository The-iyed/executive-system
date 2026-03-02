import { SECTOR_OPTIONS, MINISTER_SUPPORT_TYPE_OPTIONS, PRESENTATION_DURATION_MINUTES_OPTIONS, type FormTableColumn, MEETING_CLASSIFICATION_OPTIONS, getInviteesTableColumns } from '@/modules/shared';

export { MEETING_CLASSIFICATION_OPTIONS };

export const CONFIDENTIALITY_OPTIONS = [
  { value: 'CONFIDENTIAL', label: 'سرّي' },
  { value: 'NORMAL', label: 'عادي' },
];

export const MEETING_NATURE_OPTIONS = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'SEQUENTIAL', label: 'إلحاقي' },
  { value: 'PERIODIC', label: 'دوري' },
];

export { SECTOR_OPTIONS };

export const PREVIOUS_MEETING_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'w-24' },
  { id: 'meeting_subject', header: 'موضوع الاجتماع', type: 'text', placeholder: 'موضوع الاجتماع', width: 'w-full' },
  { id: 'meeting_date', header: 'تاريخ الاجتماع', type: 'date', width: 'min-w-[210px]', placeholder: 'dd/mm/yyyy' },
  { id: 'action', header: 'إجراء', width: 'w-[60px]' },
];

export const MEETING_GOALS_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'w-24' },
  { id: 'objective', header: 'الهدف', type: 'text', placeholder: 'الهدف', width: 'w-full' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const MEETING_AGENDA_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'w-24' },
  { id: 'agenda_item', header: 'الأجندة', type: 'text', placeholder: 'عنصر الأجندة', width: 'w-full' },
  { id: 'minister_support_type', header: 'الدعم المطلوب من الوزير', type: 'select', selectOptions: MINISTER_SUPPORT_TYPE_OPTIONS, placeholder: 'إحاطة / تحديث / قرار / توجيه / اعتماد / أخرى', width: 'w-full' },
  { id: 'presentation_duration_minutes', header: 'مدة العرض (بالدقائق)', type: 'select', selectOptions: PRESENTATION_DURATION_MINUTES_OPTIONS, placeholder: 'اختر المدة', width: 'w-40' },
  { id: 'minister_support_other', header: 'نص الدعم (عند اختيار أخرى)', type: 'text', placeholder: 'أدخل نص الدعم', width: 'w-full', showWhen: { field: 'minister_support_type', value: 'أخرى' } },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const MINISTER_SUPPORT_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'w-24' },
  { id: 'support_description', header: 'الدعم', type: 'text', placeholder: 'الدعم', width: 'w-full' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const RELATED_DIRECTIVES_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'min-w-[100px]' },
  { id: 'directive', header: 'التوجيه', type: 'text', placeholder: 'التوجيه', width: 'w-full' },
  { id: 'previousMeeting', header: 'الاجتماع السابق', type: 'text', placeholder: 'الاجتماع السابق', width: 'w-full' },
  { id: 'directiveDate', header: 'تاريخ التوجيه', type: 'date', width: 'min-w-[210px]', placeholder: 'dd/mm/yyyy' },
  { id: 'directiveStatus', header: 'حالة التوجيه', type: 'text', placeholder: 'حالة التوجيه', width: 'w-full' },
  { id: 'dueDate', header: 'تاريخ الاستحقاق', type: 'date', width: 'min-w-[210px]', placeholder: 'dd/mm/yyyy' },
  { id: 'responsible', header: 'المسؤول', type: 'text', placeholder: 'المسؤول', width: 'w-full' },
  { id: 'action', header: 'إجراء', width: 'w-[60px]' },
];

export enum MeetingChannel {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
  HYBRID = 'HYBRID',
}

export const MEETING_CHANNEL_OPTIONS = [
  { value: MeetingChannel.PHYSICAL, label: 'حضوري' },
  { value: MeetingChannel.VIRTUAL, label: 'افتراضي' },
  { value: MeetingChannel.HYBRID, label: 'مختلط' },
];

/** Location dropdown options (same as UC01). */
export const LOCATION_OPTIONS = {
  ALIYA: 'العليا',
  GHADEER: 'الغدير',
  OTHER: 'موقع آخر',
} as const;

export type LocationOptionValue = (typeof LOCATION_OPTIONS)[keyof typeof LOCATION_OPTIONS];

export const MEETING_LOCATION_OPTIONS: { value: LocationOptionValue; label: string }[] = [
  { value: LOCATION_OPTIONS.ALIYA, label: LOCATION_OPTIONS.ALIYA },
  { value: LOCATION_OPTIONS.GHADEER, label: LOCATION_OPTIONS.GHADEER },
  { value: LOCATION_OPTIONS.OTHER, label: LOCATION_OPTIONS.OTHER },
];

export function isPresetLocation(value: string | undefined): value is LocationOptionValue {
  return value === LOCATION_OPTIONS.ALIYA || value === LOCATION_OPTIONS.GHADEER;
}

export function getLocationDropdownValue(
  location: string | undefined,
  location_option: string | undefined
): '' | LocationOptionValue {
  const loc = location?.trim() ?? '';
  if (loc === LOCATION_OPTIONS.ALIYA || loc === LOCATION_OPTIONS.GHADEER) return loc;
  if (loc !== '') return LOCATION_OPTIONS.OTHER;
  return (location_option as '' | LocationOptionValue) ?? '';
}

export function showLocationOtherInput(
  location: string | undefined,
  location_option: string | undefined
): boolean {
  const loc = location?.trim() ?? '';
  if (isPresetLocation(loc)) return false;
  if (loc !== '') return true;
  return location_option === LOCATION_OPTIONS.OTHER;
}

/** Attendance mode options for invitees (backend: IN_PERSON | REMOTE). */
export const ATTENDANCE_MODE_OPTIONS = [
  { value: 'IN_PERSON', label: 'حضوري' },
  { value: 'REMOTE', label: 'عن بُعد' },
] as const;

/** Shared invitees table columns (same structure as UC01 Step3); used for both قائمة المدعوين and مدعوو الوزير tables. */
export const INVITEES_TABLE_COLUMNS = getInviteesTableColumns({
  nameFieldId: 'full_name',
  positionFieldId: 'position_title',
  sectorFieldId: 'sector',
  mobileFieldId: 'mobile_number',
  emailFieldId: 'email',
  attendanceFieldId: 'attendance_mode',
  attendanceOptions: [...ATTENDANCE_MODE_OPTIONS],
  includeViewPermission: true,
  viewPermissionFieldId: 'view_permission',
});

/** Minister invitees table columns: البريد first, then الاسم، المنصب، الجوال، آلية الحضور، مطلوب، المبرر */
export const MINISTER_INVITEES_TABLE_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: '#', width: 'w-14 shrink-0' },
  { id: 'email', header: 'البريد', type: 'text', placeholder: 'البريد', width: 'w-[220px] min-w-[220px]' },
  { id: 'full_name', header: 'الاسم', type: 'text', placeholder: 'الاسم', width: 'w-[180px] min-w-[180px]' },
  { id: 'position_title', header: 'المنصب', type: 'text', placeholder: 'المنصب', width: 'w-[160px] min-w-[160px]' },
  { id: 'mobile_number', header: 'الجوال', type: 'text', placeholder: 'الجوال', width: 'w-[140px] min-w-[140px]' },
  {
    id: 'attendance_mode',
    header: 'آلية الحضور',
    type: 'select',
    selectOptions: [...ATTENDANCE_MODE_OPTIONS],
    placeholder: 'حضوري / عن بُعد',
    width: 'w-[140px] min-w-[140px]',
  },
  { id: 'view_permission', header: 'مطلوب', type: 'switch', label: false, width: 'w-[90px] min-w-[90px]' },
  { id: 'sector', header: 'المبرر', type: 'text', placeholder: 'المبرر', width: 'w-[140px] min-w-[140px]' },
  { id: 'isOwner', header: 'مالك الاجتماع', width: 'w-[120px] min-w-[120px]' },
  { id: 'action', header: '', width: 'w-14 shrink-0' },
];

/** Max hours between now and meeting start without requiring presentation_required to be set when no file is uploaded. */
export const MAX_ALLOWED_HOURS_WITHOUT_PRESENTATION = 48;

export const STEP_LABELS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'المحتوى' },
  { id: 'step3', label: 'قائمة المدعوين' },
];

export const STEP1_TABS = [
  { id: 'meeting-info' as const, label: 'معلومات الاجتماع' },
  { id: 'other-sections' as const, label: 'باقي الأقسام' },
];

export const STEP1_ASYNC_SELECT_PAGE_SIZE = 10;