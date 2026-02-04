import type { FormTableColumn } from '@shared';
import { AttendanceMechanism } from '@shared/types';

// ============================================================================
// STEP 1 CONSTANTS
// ============================================================================

export const MEETING_CATEGORY_OPTIONS = [
  { value: 'COUNCILS_AND_COMMITTEES', label: 'المجالس واللجان' },
  { value: 'EVENTS_AND_VISITS', label: 'الفعاليات والزيارات' },
  { value: 'BILATERAL_MEETING', label: 'لقاء ثنائي' },
  { value: 'PRIVATE_MEETING', label: 'لقاء خاص' },
  { value: 'WORKSHOP', label: 'ورشة عمل' },
  { value: 'DISCUSSION_WITHOUT_PRESENTATION', label: 'مناقشة (بدون عرض تقديمي)' },
  { value: 'BUSINESS', label: 'اجتماعات الأعمال' },
  { value: 'GOVERNMENT_CENTER_TOPICS', label: 'مواضيع مركز الحكومة' },
];

export const MEETING_CLASSIFICATION_OPTIONS = [
  { value: 'STRATEGIC', label: 'استراتيجي' },
  { value: 'OPERATIONAL', label: 'تشغيلي' },
];

export const CONFIDENTIALITY_OPTIONS = [
  { value: 'CONFIDENTIAL', label: 'سرّي' },
  { value: 'NORMAL', label: 'عادي' },
];

export const MEETING_TYPE_OPTIONS = [
  { value: 'INTERNAL', label: 'داخلي' },
  { value: 'EXTERNAL', label: 'خارجي' },
];

/** آلية انعقاد الاجتماع: حضوري / عن بعد — sent to API as meeting_channel */
export const MEETING_CHANNEL_OPTIONS = [
  { value: 'PHYSICAL', label: AttendanceMechanism.PHYSICAL },
  { value: 'VIRTUAL', label: AttendanceMechanism.VIRTUAL },
];

export const DIRECTIVE_METHOD_OPTIONS = [
  { value: 'DIRECT_DIRECTIVE', label: 'توجيه مباشر' },
  { value: 'PREVIOUS_MEETING', label: 'اجتماع سابق' },
];

// Minister support type: إحاطة، تحديث، قرار، توجيه، اعتماد، أخرى (يقوم بالإدخال)
export const MINISTER_SUPPORT_TYPE_OPTIONS = [
  { value: 'إحاطة', label: 'إحاطة' },
  { value: 'تحديث', label: 'تحديث' },
  { value: 'قرار', label: 'قرار' },
  { value: 'توجيه', label: 'توجيه' },
  { value: 'اعتماد', label: 'اعتماد' },
  { value: 'أخرى', label: 'أخرى (يقوم بالإدخال)' },
];

// مدة العرض: مدة زمنية بالدقائق (قائمة اختيار)
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

// جدول أجندة الاجتماع: رقم البند، الأجندة، الدعم المطلوب من الوزير، مدة العرض (بالدقائق)، ونص الدعم يظهر عند اختيار أخرى
export const MEETING_AGENDA_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'agenda_item', header: 'الأجندة', type: 'text', placeholder: 'عنصر الأجندة', width: 'w-full' },
  { id: 'minister_support_type', header: 'الدعم المطلوب من الوزير', type: 'select', selectOptions: MINISTER_SUPPORT_TYPE_OPTIONS, placeholder: 'إحاطة / تحديث / قرار / توجيه / اعتماد / أخرى', width: 'w-full' },
  { id: 'presentation_duration_minutes', header: 'مدة العرض (بالدقائق)', type: 'select', selectOptions: PRESENTATION_DURATION_MINUTES_OPTIONS, placeholder: 'اختر المدة', width: 'w-40' },
  { id: 'minister_support_other', header: 'نص الدعم (عند اختيار أخرى)', type: 'text', placeholder: 'أدخل نص الدعم', width: 'w-full', showWhen: { field: 'minister_support_type', value: 'أخرى' } },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

// ============================================================================
// STEP 2 CONSTANTS
// ============================================================================

export const INVITEES_TABLE_COLUMNS: FormTableColumn[] = [
  {
    id: 'itemNumber',
    header: 'رقم البند',
    width: 'min-w-[100px]',
  },
  {
    id: 'name',
    header: 'الإسم',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'position',
    header: 'المنصب',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'mobile',
    header: 'الجوال',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'email',
    header: 'البريد الإلكتروني',
    type: 'text',
    placeholder: '-------',
    width: 'min-w-[210px]',
  },
  {
    id: 'attendance_mechanism',
    header: 'آلية الحضور',
    type: 'select',
    selectOptions: [
      { value: AttendanceMechanism.PHYSICAL, label: AttendanceMechanism.PHYSICAL },
      { value: AttendanceMechanism.VIRTUAL, label: AttendanceMechanism.VIRTUAL },
    ],
    width: 'min-w-[210px]',
  },
  {
    id: 'action',
    header: 'إجراء',
    width: 'w-[60px]',
  },
];

export const INVITEES_TABLE_TITLE = 'قائمة المدعوين';
export const ADD_INVITEE_BUTTON_LABEL = 'إضافة مدعو جديد';

// ============================================================================
// STEP LABELS
// ============================================================================

export const STEP_LABELS = [
  { id: 'step1', label: 'معلومات الاجتماع' },
  { id: 'step2', label: 'المحتوى' },
  { id: 'step3', label: 'قائمة المدعوين' },
  // { id: 'step4', label: 'موعد الاجتماع' },
];
