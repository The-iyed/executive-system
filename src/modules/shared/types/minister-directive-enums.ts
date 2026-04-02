/**
 * Shared enums and labels for Minister Directives (UC-19 & guiding-light).
 */

export type DirectiveType = 'SCHEDULING' | 'GENERAL' | 'EXECUTIVE_OFFICE' | 'GOVERNMENT_CENTER';
export type ImportanceLevel = 'VERY_IMPORTANT' | 'IMPORTANT' | 'NORMAL';
export type PriorityLevel = 'VERY_URGENT' | 'URGENT' | 'NORMAL';
export type DurationUnit = 'HOUR' | 'DAY';
export type DirectiveStatus = 'TAKEN' | 'ADOPTED';
export type SchedulingOfficerStatus = 'OPEN' | 'CLOSED';

export const DIRECTIVE_TYPE_LABELS: Record<DirectiveType, string> = {
  SCHEDULING: 'جدولة',
  GENERAL: 'عام',
  GOVERNMENT_CENTER: 'مركز الحكومة',
  EXECUTIVE_OFFICE: 'المكتب التنفيذي',
};

export const IMPORTANCE_LABELS: Record<ImportanceLevel, string> = {
  VERY_IMPORTANT: 'مهم جداً',
  IMPORTANT: 'مهم',
  NORMAL: 'عادي',
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  VERY_URGENT: 'عاجل جداً',
  URGENT: 'عاجل',
  NORMAL: 'عادي',
};

export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
  HOUR: 'ساعة',
  DAY: 'يوم',
};

export const DIRECTIVE_STATUS_LABELS: Record<DirectiveStatus, string> = {
  TAKEN: 'تم الأخذ بالتوجيه',
  ADOPTED: 'تم اعتماد التوجيه',
};

export const SCHEDULING_OFFICER_STATUS_LABELS: Record<SchedulingOfficerStatus, string> = {
  OPEN: 'قيد المتابعة',
  CLOSED: 'مكتمل',
};

/** Filter option helpers (excludes SCHEDULING — that's handled in UC-02) */
export const DIRECTIVE_TYPE_OPTIONS: { value: DirectiveType; label: string }[] = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'GOVERNMENT_CENTER', label: 'مركز الحكومة' },
  { value: 'EXECUTIVE_OFFICE', label: 'المكتب التنفيذي' },
];

export const IMPORTANCE_OPTIONS: { value: ImportanceLevel; label: string }[] = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'IMPORTANT', label: 'مهم' },
  { value: 'VERY_IMPORTANT', label: 'مهم جداً' },
];

export const PRIORITY_OPTIONS: { value: PriorityLevel; label: string }[] = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'URGENT', label: 'عاجل' },
  { value: 'VERY_URGENT', label: 'عاجل جداً' },
];

/** Options for create form (excludes SCHEDULING) */
export const DIRECTIVE_TYPE_CREATE_OPTIONS: { value: DirectiveType; label: string }[] = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'EXECUTIVE_OFFICE', label: 'المكتب التنفيذي' },
  { value: 'GOVERNMENT_CENTER', label: 'مركز الحكومة' },
];

/** Full type list for create modal (includes جدولة) */
export const DIRECTIVE_TYPE_FORM_OPTIONS: { value: DirectiveType; label: string }[] = [
  { value: 'SCHEDULING', label: DIRECTIVE_TYPE_LABELS.SCHEDULING },
  { value: 'GENERAL', label: DIRECTIVE_TYPE_LABELS.GENERAL },
  { value: 'EXECUTIVE_OFFICE', label: DIRECTIVE_TYPE_LABELS.EXECUTIVE_OFFICE },
  { value: 'GOVERNMENT_CENTER', label: DIRECTIVE_TYPE_LABELS.GOVERNMENT_CENTER },
];
