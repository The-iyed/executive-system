import axiosInstance from '../../auth/utils/axios';

export interface StatsCard {
  heading: string;
  number: string;
}

export interface DashboardStatsResponse {
  scheduled_meetings: number;
  returned_for_modification: number;
  under_review: number;
  drafts_in_preparation: number;
}

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await axiosInstance.get<DashboardStatsResponse>('/api/meetings/dashboard');
  return response.data;
};
