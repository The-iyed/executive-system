import axiosInstance from '../../auth/utils/axios';
import { MeetingStatus } from '@/modules/shared/types';

export interface GetMeetingsParams {
  status?: MeetingStatus | string;
  owner_type?: string;
  skip?: number;
  limit?: number;
  search?: string;
}

export interface MeetingApiResponse {
  id: string;
  request_number: string;
  status: string;
  meeting_title: string;
  meeting_subject: string;
  created_at: string;
  submitted_at: string;
  scheduled_at: string | null;
  submitter_name: string;
  submitter_id?: string;
  meeting_channel: string;
  meeting_type?: string;
  meeting_classification?: string;
  meeting_classification_type?: string;
  meeting_confidentiality?: string;
  meeting_justification?: string;
  related_topic?: string | null;
  deadline?: string | null;
  sector?: string;
  requires_protocol?: boolean;
  current_owner_user_id?: string;
  meeting_owner_name?: string;
  location?: string;
  [key: string]: unknown;
}

export interface MeetingsListResponse {
  items: MeetingApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export const getMeetings = async (params: GetMeetingsParams = {}): Promise<MeetingsListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.owner_type) {
    queryParams.append('owner_type', params.owner_type);
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

  const response = await axiosInstance.get<MeetingsListResponse>(`/api/meetings?${queryParams.toString()}`);
  return response.data;
};

export const getMeetingById = async (meetingId: string): Promise<MeetingApiResponse> => {
  const response = await axiosInstance.get<MeetingApiResponse>(`/api/meetings/${meetingId}`);
  return response.data;
};

// Users API
export interface GetUsersParams {
  search?: string;
  role_code?: string;
  user_type?: string;
  skip?: number;
  limit?: number;
}

export interface UserApiResponse {
  id: string;
  name: string;
  email?: string;
  [key: string]: any;
}

export interface UsersListResponse {
  items: UserApiResponse[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export const getUsers = async (params: GetUsersParams = {}): Promise<UsersListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.role_code) {
    queryParams.append('role_code', params.role_code);
  }
  if (params.user_type) {
    queryParams.append('user_type', params.user_type);
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await axiosInstance.get<UsersListResponse>(`/api/meeting-requests/users?${queryParams.toString()}`);
  return response.data;
};

