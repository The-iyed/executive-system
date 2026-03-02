/**
 * Shared API: guidance records (used by UC02, UC04).
 */
import axiosInstance from '../../auth/utils/axios';
import type { GuidanceRecordsResponse } from '../types';

export const getGuidanceRecords = async (
  meetingId: string,
  withDrafts?: boolean
): Promise<GuidanceRecordsResponse> => {
  const url =
    withDrafts === undefined
      ? `/api/meeting-requests/${meetingId}/guidance-record`
      : `/api/meeting-requests/${meetingId}/guidance-record?with_drafts=${withDrafts}`;
  const response = await axiosInstance.get<GuidanceRecordsResponse>(url);
  return response.data;
};
