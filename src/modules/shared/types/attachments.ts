/**
 * Shared domain types for attachment comparisons and insights.
 */

export interface ComparePresentationsSummary {
  total_slides_original: number;
  total_slides_new: number;
  slide_count_difference: number;
  unchanged_slides: number;
  minor_changes: number;
  moderate_changes: number;
  major_changes: number;
  new_slides: number;
}

export interface ComparePresentationsResponse {
  comparison_id: string;
  overall_score: number;
  difference_level: string;
  status: string;
  regeneration_recommendation: string;
  summary: ComparePresentationsSummary;
  slide_by_slide?: Record<string, unknown>[];
  regeneration_decision?: Record<string, unknown>;
  ai_insights?: {
    main_topics?: string[];
    business_impact?: string;
    risk_assessment?: string;
    presentation_coherence?: string;
    slide_count_comparison?: {
      original_count?: number;
      new_count?: number;
      difference?: number;
    };
  };
}

export interface CompareByAttachmentPostResponse {
  comparison_id: string;
  status: string;
  created_at?: string;
  completed_at?: string;
  is_new?: boolean;
  task_id?: string | null;
}

export interface GetComparisonByAttachmentResponse {
  comparison_id: string;
  status: string;
  created_at?: string;
  completed_at?: string;
  result: ComparePresentationsResponse;
}

export interface AttachmentInsightsResponse {
  attachment_id: string;
  presentation_id: string;
  extraction_status: string;
  llm_processing_status: string;
  llm_notes?: string[];
  llm_suggestions?: string[];
}
