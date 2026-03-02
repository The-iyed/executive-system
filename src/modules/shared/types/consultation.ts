/**
 * Shared domain types for consultations (records, assignees, params).
 */

export interface AssigneeSection {
  user_id: string;
  assignee_name: string;
  responded_at: string | null;
  status: string;
  answers: string[];
  assignee_role: string | null;
  consultation_record_number: string;
}

export interface ConsultationAssigneeAnswer {
  answer_id: string;
  text: string;
  responded_at: string | null;
}

export interface ConsultationAssignee {
  user_id: string;
  name: string;
  role: string | null;
  status: string;
  responded_at: string | null;
  request_number: string | null;
  answers: ConsultationAssigneeAnswer[];
}

export interface ConsultationAnswer {
  consultation_id: string;
  consultation_answer: string;
  responded_at: string;
  status: string;
  is_draft: boolean;
  external_id: string | null;
}

export interface ConsultationRecord {
  id?: string;
  type?: string;
  question?: string;
  round_number?: number;
  assignees?: ConsultationAssignee[];
  consultation_id?: string;
  consultation_type?: string;
  consultation_question?: string;
  consultant_user_id?: string;
  consultant_name?: string;
  requested_at: string;
  assignee_sections?: AssigneeSection[];
  consultation_answers?: ConsultationAnswer[];
  consultation_answer?: string | null;
  responded_at?: string | null;
  status?: string;
  consultation_request_number?: string;
  is_draft?: boolean;
}

export interface ConsultationRecordsResponse {
  items: ConsultationRecord[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GetConsultationRecordsParams {
  consultation_type?: string;
  include_drafts?: boolean;
  skip?: number;
  limit?: number;
}
