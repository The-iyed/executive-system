// Import axios instance - using relative path since @auth doesn't export it
import axiosInstance from '../../auth/utils/axios';
import { MeetingStatus } from '@shared/types';

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
  meeting_channel: string;
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

// Directives API
export interface GetDirectivesParams {
  search?: string;
  skip?: number;
  limit?: number;
}

export interface DirectiveApiResponse {
  id: string;
  directive_number?: string;
  directive_date?: string;
  directive_text?: string;
  related_meeting?: string;
  deadline?: string | null;
  responsible_persons?: string[];
  directive_status?: string;
  related_meeting_request_id?: string | null;
  created_at?: string;
  created_by?: string;
  closed_at?: string | null;
  closed_by?: string | null;
  [key: string]: any;
}

export interface DirectivesGroupResponse {
  items: DirectiveApiResponse[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DirectivesListResponse {
  current_directives: DirectivesGroupResponse;
  previous_directives: DirectivesGroupResponse;
  skip: number;
  limit: number;
}

export const getDirectives = async (params: GetDirectivesParams = {}): Promise<DirectiveApiResponse[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await axiosInstance.get<DirectivesListResponse>(`/api/scheduling/directives?${queryParams.toString()}`);
  
  // Combine current and previous directives into a single array
  const allDirectives = [
    ...(response.data.current_directives?.items || []),
    ...(response.data.previous_directives?.items || []),
  ];
  
  return allDirectives;
};

// Get directives with pagination info
export interface GetDirectivesPaginatedResponse {
  items: DirectiveApiResponse[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export const getDirectivesPaginated = async (params: GetDirectivesParams = {}): Promise<GetDirectivesPaginatedResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const response = await axiosInstance.get<DirectivesListResponse>(`/api/scheduling/directives?${queryParams.toString()}`);
  
  // Combine current and previous directives
  const allDirectives = [
    ...(response.data.current_directives?.items || []),
    ...(response.data.previous_directives?.items || []),
  ];
  
  // Use current_directives metadata for pagination
  const currentMeta = response.data.current_directives || response.data.previous_directives;
  
  return {
    items: allDirectives,
    total: (currentMeta?.total || 0) + (response.data.previous_directives?.total || 0),
    skip: response.data.skip,
    limit: response.data.limit,
    has_next: currentMeta?.has_next || false,
    has_previous: currentMeta?.has_previous || false,
  };
};

export const getDirectiveById = async (directiveId: string): Promise<DirectiveApiResponse> => {
  const response = await axiosInstance.get<DirectiveApiResponse>(`/api/scheduling/directives/${directiveId}`);
  return response.data;
};
