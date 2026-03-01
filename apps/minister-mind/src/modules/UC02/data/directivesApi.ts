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

  const response = await axiosInstance.get(`/api/scheduling/directives?${queryParams.toString()}`);
  const data = response.data as Record<string, unknown>;
  const skip = params.skip ?? 0;
  const limit = params.limit ?? 10;

  if (Array.isArray(data.items)) {
    return {
      items: data.items as DirectiveApiResponse[],
      total: Number(data.total) || 0,
      skip: Number(data.skip) ?? skip,
      limit: Number(data.limit) ?? limit,
      has_next: Boolean(data.has_next),
      has_previous: Boolean(data.has_previous),
    };
  }

  const current = (data.current_directives as DirectivesGroupResponse | undefined);
  const previous = (data.previous_directives as DirectivesGroupResponse | undefined);
  const allDirectives: DirectiveApiResponse[] = [
    ...(current?.items || []),
    ...(previous?.items || []),
  ];
  const currentMeta = current || previous;

  return {
    items: allDirectives,
    total: (currentMeta?.total ?? 0) + (previous?.total ?? 0),
    skip: typeof data.skip === 'number' ? data.skip : skip,
    limit: typeof data.limit === 'number' ? data.limit : limit,
    has_next: currentMeta?.has_next ?? false,
    has_previous: currentMeta?.has_previous ?? false,
  };
};

export const getDirectiveById = async (directiveId: string): Promise<DirectiveApiResponse> => {
  const response = await axiosInstance.get<DirectiveApiResponse>(`/api/scheduling/directives/${directiveId}`);
  return response.data;
};
