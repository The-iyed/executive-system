import { SECTOR_OPTIONS, type  FormTableColumn } from '@shared';

export const MEETING_CATEGORY_OPTIONS = [
  { value: 'COUNCILS_AND_COMMITTEES', label: 'المجالس واللجان' },
  { value: 'EVENTS_AND_VISITS', label: 'الفعاليات والزيارات' },
  { value: 'BILATERAL_MEETING', label: 'لقاء ثنائي' },
  { value: 'PRIVATE_MEETING', label: 'لقاء خاص' },
  { value: 'BUSINESS', label: 'أعمال' },
  { value: 'GOVERNMENT_CENTER_TOPICS', label: 'مواضيع مركز الحكومة' },
];

export const MEETING_CLASSIFICATION_OPTIONS = [
  { value: 'STRATEGIC', label: 'استراتيجي' },
  { value: 'OPERATIONAL', label: 'تشغيلي' },
  { value: 'SPECIAL', label: 'خاص' },
];

export const CONFIDENTIALITY_OPTIONS = [
  { value: 'CONFIDENTIAL', label: 'سرّي' },
  { value: 'NORMAL', label: 'عادي' },
];

export const MEETING_TYPE_OPTIONS = [
  { value: 'INTERNAL', label: 'داخلي' },
  { value: 'EXTERNAL', label: 'خارجي' },
];

export const MEETING_NATURE_OPTIONS = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'SEQUENTIAL', label: 'إلحاقي' },
  { value: 'PERIODIC', label: 'دوري' },
];

export { SECTOR_OPTIONS };

export const PREVIOUS_MEETING_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'meeting_subject', header: 'موضوع الاجتماع', type: 'text', placeholder: 'موضوع الاجتماع', width: 'w-full' },
  { id: 'meeting_date', header: 'تاريخ الاجتماع', type: 'date', width: 'min-w-[210px]', placeholder: 'dd/mm/yyyy' },
  { id: 'action', header: 'إجراء', width: 'w-[60px]' },
];

export const MEETING_GOALS_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'objective', header: 'الهدف', type: 'text', placeholder: 'الهدف', width: 'w-full' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const MINISTER_SUPPORT_TYPE_OPTIONS = [
  { value: 'إحاطة', label: 'إحاطة' },
  { value: 'تحديث', label: 'تحديث' },
  { value: 'قرار', label: 'قرار' },
  { value: 'توجيه', label: 'توجيه' },
  { value: 'اعتماد', label: 'اعتماد' },
  { value: 'أخرى', label: 'أخرى (يقوم بالإدخال)' },
];

export const PRESENTATION_DURATION_MINUTES_OPTIONS = [
  { value: '0', label: '0 دقيقة' },
  { value: '5', label: '5 دقائق' },
  { value: '10', label: '10 دقائق' },
  { value: '15', label: '15 دقيقة' },
  { value: '20', label: '20 دقيقة' },
  { value: '25', label: '25 دقيقة' },
  { value: '30', label: '30 دقيقة' },
  { value: '45', label: '45 دقيقة' },
  { value: '60', label: '60 دقيقة' },
  { value: '90', label: '90 دقيقة' },
  { value: '120', label: '120 دقيقة' },
  { value: '180', label: '180 دقيقة' },
];

export const MEETING_AGENDA_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'agenda_item', header: 'الأجندة', type: 'text', placeholder: 'عنصر الأجندة', width: 'w-full' },
  { id: 'minister_support_type', header: 'الدعم المطلوب من الوزير', type: 'select', selectOptions: MINISTER_SUPPORT_TYPE_OPTIONS, placeholder: 'إحاطة / تحديث / قرار / توجيه / اعتماد / أخرى', width: 'w-full' },
  { id: 'presentation_duration_minutes', header: 'مدة العرض (بالدقائق)', type: 'select', selectOptions: PRESENTATION_DURATION_MINUTES_OPTIONS, placeholder: 'اختر المدة', width: 'w-40' },
  { id: 'minister_support_other', header: 'نص الدعم (عند اختيار أخرى)', type: 'text', placeholder: 'أدخل نص الدعم', width: 'w-full', showWhen: { field: 'minister_support_type', value: 'أخرى' } },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const MINISTER_SUPPORT_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'support_description', header: 'الدعم', type: 'text', placeholder: 'الدعم', width: 'w-full' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const RELATED_DIRECTIVES_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'min-w-[100px]' },
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

/** Attendance mode options for invitees (backend: IN_PERSON | REMOTE). */
export const ATTENDANCE_MODE_OPTIONS = [
  { value: 'IN_PERSON', label: 'حضوري' },
  { value: 'REMOTE', label: 'عن بُعد' },
] as const;

export const INVITEES_TABLE_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'min-w-[100px]' },
  {
    id: 'full_name',
    header: 'الاسم الكامل',
    type: 'text',
    placeholder: 'الاسم الكامل',
    width: 'min-w-[210px]',
  },
  {
    id: 'position_title',
    header: 'المسمى الوظيفي',
    type: 'text',
    placeholder: 'المسمى الوظيفي',
    width: 'min-w-[210px]',
  },
  {
    id: 'mobile_number',
    header: 'رقم الجوال',
    type: 'text',
    placeholder: 'رقم الجوال',
    width: 'min-w-[210px]',
  },
  {
    id: 'email',
    header: 'البريد الإلكتروني',
    type: 'text',
    placeholder: 'البريد الإلكتروني',
    width: 'min-w-[210px]',
  },
  {
    id: 'attendance_mode',
    header: 'آلية الحضور',
    type: 'select',
    selectOptions: [...ATTENDANCE_MODE_OPTIONS],
    placeholder: 'اختر',
    width: 'min-w-[210px]',
  },
  {
    id: 'view_permission',
    header: 'صلاحية العرض',
    type: 'switch',
    label: false,
    width: 'min-w-[210px]',
  },
  { id: 'action', header: '', width: 'w-[60px]' },
];

export const INVITEES_TABLE_TITLE = 'قائمة المدعوين (مقدّم الطلب)';
export const ADD_INVITEE_BUTTON_LABEL = 'إضافة مدعو';

export const MINISTER_INVITEES_TABLE_TITLE = 'مدعوو الوزير';
export const ADD_MINISTER_INVITEE_BUTTON_LABEL = 'إضافة مدعو للوزير';

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