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
