/**
 * Shared API: meetings list and detail (used by UC01, UC02, UC08).
 */
import axiosInstance from '../../auth/utils/axios';
import type {
  MeetingApiResponse,
  MeetingsListResponse,
  GetMeetingsParams,
} from '../types';

export const getMeetingById = async (meetingId: string): Promise<MeetingApiResponse> => {
  const response = await axiosInstance.get<MeetingApiResponse>(`/api/meetings/${meetingId}`);
  return response.data;
};

export const getMeetings = async (params: GetMeetingsParams = {}): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.owner_type) queryParams.append('owner_type', params.owner_type);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  const response = await axiosInstance.get<MeetingsListResponse>(`/api/meetings?${queryParams.toString()}`);
  return response.data;
};

export const getAssignedSchedulingRequests = async (
  params: GetMeetingsParams = {}
): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  const response = await axiosInstance.get<MeetingsListResponse>(
    `/api/scheduling/assigned-requests?${queryParams.toString()}`
  );
  return response.data;
};

export const getWaitingList = async (
  params: GetMeetingsParams = {}
): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  const response = await axiosInstance.get<MeetingsListResponse>(
    `/api/scheduling/waiting-list?${queryParams.toString()}`
  );
  return response.data;
};

// --- Meetings match (AI suggestions) ---
export interface MeetingMatchSuggestedActionWritten {
  uep_id: string;
  title: string;
  status: string;
  success: boolean;
  error: string | null;
}

export interface MeetingMatchResultItem {
  attachment_id: string;
  attachment_version: number;
  doc_key: string;
  meeting_id: number;
  extracted_content_preview: string;
  presentation_summary: string;
  total_historical_actions: number;
  total_matched: number;
  matched_actions: Array<{
    action_id: number;
    action_title: string;
    similarity_level: string;
    similarity_reason: string;
    relevance_keywords: string[];
  }>;
  suggested_actions_written: MeetingMatchSuggestedActionWritten[];
  matching_summary: string;
  processed_at: string;
}

export interface MeetingMatchResponse {
  results: MeetingMatchResultItem[];
}

export const postMeetingsMatch = async (
  meetingRequestId: string
): Promise<MeetingMatchResponse> => {
  const response = await axiosInstance.post<MeetingMatchResponse>(
    '/api/meetings/match',
    { meeting_request_id: meetingRequestId }
  );
  return response.data;
};
