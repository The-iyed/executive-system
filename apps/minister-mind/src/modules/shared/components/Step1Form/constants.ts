// Dropdown options - These should be fetched from API in production
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
  { value: 'FORMAL', label: 'رسمي' },
  { value: 'INFORMAL', label: 'غير رسمي' },
];

export const SECTOR_OPTIONS = [
  { value: 'SECTOR1', label: 'قطاع 1' },
  { value: 'SECTOR2', label: 'قطاع 2' },
];

// Table Column Definitions
import type { FormTableColumn } from '../FormTable';

export const MEETING_GOALS_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'objective', header: 'الهدف', type: 'text', placeholder: '-------' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const MEETING_AGENDA_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'agenda_item', header: 'الأجندة', type: 'text', placeholder: '-------' },
  { id: 'presentation_duration_minutes', header: 'مدة العرض', type: 'text', placeholder: '-------' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const MINISTER_SUPPORT_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'support_description', header: 'الدعم', type: 'text', placeholder: '-------' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const PREVIOUS_MEETING_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'meeting_subject', header: 'موضوع الاجتماع', type: 'text', placeholder: '-------' },
  { id: 'meeting_date', header: 'تاريخ الاجتماع', type: 'date', width: 'w-40', placeholder: 'dd:mm:yyyy' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];

export const RELATED_DIRECTIVES_COLUMNS: FormTableColumn[] = [
  { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
  { id: 'previous_meeting', header: 'الاجتماع السابق', type: 'text', placeholder: '-------' },
  { id: 'directive_date', header: 'تاريخ التوجيه', type: 'date', width: 'w-40', placeholder: 'dd:mm:yyyy' },
  { id: 'directive_status', header: 'حالة التوجيه', type: 'text', placeholder: '-------' },
  { id: 'due_date', header: 'تاريخ الاستحقاق', type: 'date', width: 'w-40', placeholder: 'dd:mm:yyyy' },
  { id: 'responsible', header: 'المسؤول', type: 'text', placeholder: '-------' },
  { id: 'action', header: 'إجراء', width: 'w-20' },
];
