/**
 * Constants for meeting detail page (field labels, editable fields, options, compare/directive labels).
 */

export const fieldLabels: Record<string, string> = {
  meeting_type: 'نوع الاجتماع',
  is_urgent: 'اجتماع عاجل؟',
  meeting_title: 'عنوان الاجتماع',
  meeting_subject: 'وصف الاجتماع',
  meeting_classification: 'فئة الاجتماع',
  meeting_owner: 'مالك الاجتماع',
  is_on_behalf_of: 'هل تطلب الاجتماع نيابة عن غيرك؟',
  is_sequential: 'اجتماع متسلسل؟',
  previous_meeting_id: 'الاجتماع السابق',
  is_based_on_directive: 'هل طلب الاجتماع بناءً على توجيه من معالي الوزير',
  directive_method: 'طريقة التوجيه',
  previous_meeting_minutes_id: 'محضر الاجتماع',
  related_guidance: 'التوجيه',
  objectives: 'الأهداف',
  agenda_items: 'أجندة الاجتماع',
  meeting_channel: 'آلية انعقاد الاجتماع',
  meeting_location: 'الموقع',
  requires_protocol: 'يتطلب بروتوكول',
  protocol_type: 'نوع البروتوكول',
  is_data_complete: 'اكتمال البيانات',
  selected_time_slot_id: 'الموعد المحدد',
  minister_attendees: 'حضور الوزير',
  invitees: 'المدعوون',
  deleted_attachment_ids: 'حذف المرفقات',
  sector: 'القطاع',
  urgent_reason: 'السبب',
  meeting_justification: 'مبرر اللقاء',
  meeting_classification_type: 'تصنيف الاجتماع',
  related_topic: 'موضوع التكليف المرتبط',
  deadline: 'تاريخ الاستحقاق',
  meeting_confidentiality: 'سريّة الاجتماع',
  general_notes: 'ملاحظات',
};


/** Translate comparison API enum-like values to Arabic */
export const COMPARE_STATUS: Record<string, string> = {
  completed: 'مكتمل',
  pending: 'قيد المعالجة',
};
export const COMPARE_LEVEL: Record<string, string> = {
  minor: 'طفيف',
  moderate: 'متوسط',
  major: 'كبير',
};
export const COMPARE_RECOMMENDATION: Record<string, string> = { review: 'مراجعة' };

/** Tab IDs hidden when meeting status is SCHEDULED */
export const TABS_HIDDEN_WHEN_SCHEDULED = [
  'scheduling-consultation',
  'directive',
];

