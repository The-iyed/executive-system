/**
 * Shared domain types for guidance records.
 */

export interface GuidanceRecord {
  guidance_id: string;
  guidance_question: string;
  guidance_answer: string | null;
  requested_by_user_id: string;
  requested_by_name: string;
  responded_by_user_id: string | null;
  responded_by_name: string | null;
  requested_at: string;
  responded_at: string | null;
  status: string;
  is_draft: boolean;
}

export interface GuidanceRecordsResponse {
  items: GuidanceRecord[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}
