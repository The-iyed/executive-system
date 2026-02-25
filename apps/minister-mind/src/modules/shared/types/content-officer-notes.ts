/**
 * Shared domain types for content officer notes records.
 */

export interface ContentOfficerNoteRecord {
  id: string;
  note_type?: string;
  text?: string;
  author_id?: string;
  author_type?: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  note_id?: string;
  note_question?: string | null;
  note_answer?: string;
  author_user_id?: string;
}

export interface ContentOfficerNotesRecordsResponse {
  items: ContentOfficerNoteRecord[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GetContentOfficerNotesParams {
  skip?: number;
  limit?: number;
  consultation_type?: string;
}
