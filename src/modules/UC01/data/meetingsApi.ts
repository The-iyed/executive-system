// Import axios instance - using relative path since @auth doesn't export it
import axiosInstance from '../../auth/utils/axios';
import { MeetingStatus } from '@/modules/shared/types';

export interface GetMeetingsParams {
  /** Single status or array of statuses for multi-select filter. Sent as `status_in` (comma-separated when array). */
  status?: MeetingStatus | string | (MeetingStatus | string)[];
  owner_type?: string;
  skip?: number;
  limit?: number;
  search?: string;
  date_now?: string;
}

export interface MeetingApiResponse {
  id: string;
  request_number: string;
  status: MeetingStatus;
  meeting_title: string;
  meeting_subject: string;
  created_at: string;
  submitted_at: string;
  scheduled_at: string | null;
  submitter_name: string;
  submitter?: Record<string, unknown> | string | null;
  meeting_channel: string;
  /** فئة الاجتماع (may be missing in some API responses) */
  meeting_classification?: string | null;
  /** هل البيانات مكتملة؟ */
  is_data_complete?: boolean | null;
  meeting_start_date?: string | null;
  meeting_end_date?: string | null;
  /** Notes arrays (used for "ملاحظات الإعادة" when present) */
  general_notes?: unknown;
  content_officer_notes?: unknown;
}

export interface MeetingsListResponse {
  items: MeetingApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export const getMeetings = async (params: GetMeetingsParams = {}): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();

  const statuses = params.status === undefined || params.status === ''
    ? []
    : Array.isArray(params.status)
      ? params.status.filter(Boolean)
      : [params.status];
  if (statuses.length > 0) {
    queryParams.set('status_in', statuses.map((s) => String(s)).join(','));
  }
  // if (params.owner_type) {
  //   queryParams.append('owner_type', params.owner_type);
  // }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.date_now) {
    queryParams.append('date_now', params.date_now);
  }

  const response = await axiosInstance.get<MeetingsListResponse>(`/api/meetings/submitter-meetings?${queryParams.toString()}`);
  return response.data;
};

export interface SubmitterMeetingApiResponse {
  editable_fields?: string[];
  [key: string]: unknown;
}

export const getSubmitterMeeting = async (meetingId: string): Promise<SubmitterMeetingApiResponse> => {
  const response = await axiosInstance.get<SubmitterMeetingApiResponse>(
    `/api/meetings/my/${meetingId}`
  );
  return response.data;
};

// Fetch assigned scheduling requests (for "سلة العمل" view)
export const getAssignedSchedulingRequests = async (params: GetMeetingsParams = {}): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();

  const statuses = params.status === undefined || params.status === ''
    ? []
    : Array.isArray(params.status)
      ? params.status.filter(Boolean)
      : [params.status];
  if (statuses.length > 0) {
    queryParams.set('status_in', statuses.map((s) => String(s)).join(','));
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  const response = await axiosInstance.get<MeetingsListResponse>(`/api/scheduling/assigned-requests?${queryParams.toString()}`);
  return response.data;
};
