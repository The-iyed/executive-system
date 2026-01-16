// Import axios instance
import axiosInstance from '../../auth/utils/axios';

export interface Attachment {
  id: string;
  file_name: string;
  blob_name: string;
  blob_url: string;
  file_size: number;
  file_type: string;
  content_type: string;
  uploaded_by: string;
  uploaded_at: string;
  is_presentation: boolean;
  is_additional: boolean;
  is_executive_summary: boolean;
  version: number;
  is_latest: boolean;
}

export interface ContentConsultationRequestApiResponse {
  id: string;
  request_number: string;
  status: string;
  current_owner_type: string;
  current_owner_user_id: string;
  current_owner_role_id: string;
  submitter_id: string;
  submitter_name: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  scheduled_at: string | null;
  closed_at: string | null;
  version: number;
  meeting_title: string;
  meeting_type: string;
  meeting_subject: string;
  meeting_classification: string;
  presentation_duration: number;
  is_data_complete: boolean;
  requires_protocol: boolean;
  protocol_type: string | null;
  meeting_channel: string;
  is_sequential: boolean;
  sequential_number: number | null;
  previous_meeting_id: string | null;
  is_direct_schedule: boolean;
  attachments: Attachment[];
}

export interface ContentConsultationRequestsListResponse {
  items: ContentConsultationRequestApiResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetContentConsultationRequestsParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export const getAssignedContentConsultationRequests = async (
  params: GetContentConsultationRequestsParams = {}
): Promise<ContentConsultationRequestsListResponse> => {
  const queryParams = new URLSearchParams();

  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  const response = await axiosInstance.get<ContentConsultationRequestsListResponse>(
    `/api/content-consultant/assigned-requests?${queryParams.toString()}`
  );
  return response.data;
};


