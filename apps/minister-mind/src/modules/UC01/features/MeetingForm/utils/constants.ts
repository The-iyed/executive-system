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
  { value: 'BUSINESS', label: 'أعمال' },
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

export const DIRECTIVE_METHOD_OPTIONS = [
  { value: 'DIRECT_DIRECTIVE', label: 'توجيه مباشر' },
  { value: 'PREVIOUS_MEETING', label: 'اجتماع سابق' },
];

// Table Column Definitions for Step 1
export const MEETING_GOALS_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'objective', header: 'الهدف', type: 'text', placeholder: '-------', width: 'w-full' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

// Minister support type options per requirement: إحاطة|تحديث|قرار|توجيه|اعتماد|أخرى
export const MINISTER_SUPPORT_TYPE_OPTIONS = [
  { value: 'إحاطة', label: 'إحاطة' },
  { value: 'تحديث', label: 'تحديث' },
  { value: 'قرار', label: 'قرار' },
  { value: 'توجيه', label: 'توجيه' },
  { value: 'اعتماد', label: 'اعتماد' },
  { value: 'أخرى', label: 'أخرى' },
];

export const MEETING_AGENDA_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'agenda_item', header: 'جدول أعمال الاجتماع', type: 'text', placeholder: '-------', width: 'w-full' },
  { id: 'presentation_duration_minutes', header: 'مدة العرض', type: 'text', placeholder: '-------', width: 'w-full' },
  { id: 'minister_support_type', header: 'الدعم المطلوب من الوزير', type: 'select', selectOptions: MINISTER_SUPPORT_TYPE_OPTIONS, placeholder: '-------', width: 'w-full' },
  { id: 'minister_support_other', header: 'نص الدعم (أخرى)', type: 'text', placeholder: '-------', width: 'w-full' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const RELATED_DIRECTIVES_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'min-w-[100px]' },
  { id: 'directive', header: 'التوجيه', type: 'text', placeholder: '-------', width: 'w-full' },
  { id: 'previousMeeting', header: 'الاجتماع السابق', type: 'text', placeholder: '-------', width: 'w-full' },
  { id: 'directiveDate', header: 'تاريخ التوجيه', type: 'date', width: 'min-w-[210px]', placeholder: 'dd/mm/yyyy' },
  { id: 'directiveStatus', header: 'حالة التوجيه', type: 'text', placeholder: '-------', width: 'w-full' },
  { id: 'dueDate', header: 'تاريخ الاستحقاق', type: 'date', width: 'min-w-[210px]', placeholder: 'dd/mm/yyyy' },
  { id: 'responsible', header: 'المسؤول', type: 'text', placeholder: '-------', width: 'w-full' },
  { id: 'action', header: 'إجراء', width: 'w-[60px]' },
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
