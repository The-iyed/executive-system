/**
 * UC05 Content Request Detail – constants.
 */

/** Action status options for manual/suggested directive rows (editable). */
export const ACTION_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { value: 'COMPLETED', label: 'مكتمل' },
  { value: 'LATE', label: 'متأخر' },
] as const;

export const COMPARE_STATUS: Record<string, string> = {
  completed: 'مكتمل',
  pending: 'قيد المعالجة',
};

export const COMPARE_LEVEL: Record<string, string> = {
  minor: 'طفيف',
  moderate: 'متوسط',
  major: 'كبير',
};

export const COMPARE_RECOMMENDATION: Record<string, string> = {
  review: 'مراجعة',
};

export const CONSULTATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  RESPONDED: 'تم الرد',
  CANCELLED: 'ملغاة',
  COMPLETED: 'مكتمل',
  DRAFT: 'مسودة',
  SUPERSEDED: 'معلق',
};
