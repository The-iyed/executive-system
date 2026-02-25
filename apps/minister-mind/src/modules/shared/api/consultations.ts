/**
 * Shared API: consultation records and consultants (used by UC02, UC04, UC05, UC06).
 */
import axiosInstance from '../../auth/utils/axios';
import type {
  ConsultationRecordsResponse,
  GetConsultationRecordsParams,
  ConsultantsResponse,
  GetConsultantsParams,
  RequestSchedulingConsultationRequest,
} from '../types';

export const getConsultationRecords = async (
  meetingId: string,
  withDrafts?: boolean
): Promise<ConsultationRecordsResponse> => {
  const url =
    withDrafts === undefined
      ? `/api/meeting-requests/${meetingId}/consultation-record`
      : `/api/meeting-requests/${meetingId}/consultation-record?with_drafts=${withDrafts}`;
  const response = await axiosInstance.get<ConsultationRecordsResponse>(url);
  return response.data;
};

export const getConsultationRecordsWithParams = async (
  meetingId: string,
  params: GetConsultationRecordsParams = {}
): Promise<ConsultationRecordsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.consultation_type) {
    queryParams.append('consultation_type', params.consultation_type);
  }
  if (params.include_drafts !== undefined) {
    queryParams.append('include_drafts', params.include_drafts.toString());
  }
  if (params.skip !== undefined) {
    queryParams.append('skip', params.skip.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  const response = await axiosInstance.get<ConsultationRecordsResponse>(
    `/api/meeting-requests/${meetingId}/consultation-record?${queryParams.toString()}`
  );
  return response.data;
};

export const getConsultants = async (
  params: GetConsultantsParams = {}
): Promise<ConsultantsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.search !== undefined) {
    queryParams.append('search', params.search);
  }
  if (params.role_id) {
    queryParams.append('role_id', params.role_id);
  }
  if (params.role_code) {
    queryParams.append('role_code', params.role_code);
  }
  if (params.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  const response = await axiosInstance.get<ConsultantsResponse>(
    `/api/meeting-requests/users?${queryParams.toString()}`
  );
  return response.data;
};

export const requestSchedulingConsultation = async (
  meetingId: string,
  payload: RequestSchedulingConsultationRequest
): Promise<void> => {
  await axiosInstance.post(
    `/api/meeting-requests/${meetingId}/request-scheduling-consultation`,
    payload
  );
};
