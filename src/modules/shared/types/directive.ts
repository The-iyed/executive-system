/**
 * Shared domain types for directives (scheduling directives, external directives).
 */

export interface Directive {
  id: string;
  action_number: string;
  title: string;
  due_date: string;
  status: string;
  is_completed: boolean;
  meeting_id: string | null;
  created_date: string;
  mod_date: string | null;
  completed_at: string | null;
  assignees: string;
}

export interface DirectivesListResponse {
  items: Directive[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PreviousDirectiveItem {
  id: string;
  external_id: string;
  action_number: string;
  title: string;
  due_date: string;
  status: string;
  is_completed: boolean;
  meeting_id: string | null;
  created_date: string;
  mod_date: string;
  completed_at: string | null;
  assignees: string[];
}

export interface PreviousDirectivesListResponse {
  items: PreviousDirectiveItem[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GetDirectivesParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface CreateSchedulingDirectivePayload {
  directive_date: string;
  directive_text: string;
  related_meeting: string;
  deadline: string;
  responsible_persons: string[];
}

export interface CreateDirectivePayload {
  external_id: number;
  action_number: string;
  title: string;
  due_date: string;
  status: string;
  is_completed: boolean;
  created_date: string;
  mod_date?: string;
  completed_at?: string | null;
  assignees: string[];
}

/** Directive status labels for التوجيهات المرتبطة list (Arabic) */
export const DIRECTIVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  IN_PROGRESS: 'قيد التنفيذ',
  CURRENT: 'جاري',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  CLOSED: 'مغلق',
  OPEN: 'مفتوح',
};
