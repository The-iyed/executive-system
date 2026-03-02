import axiosInstance from '@auth/utils/axios';

/** AD user from search by email API - uses actual response columns */
export interface ADUserByEmail {
  objectGUID?: string;
  mail?: string;
  mobile?: string;
  displayName?: string;
  displayNameAR?: string;
  displayNameEN?: string;
  givenName?: string;
  cn?: string;
  sn?: string;
  title?: string;
  department?: string;
  company?: string;
}

/**
 * Search AD users by email.
 * GET /api/v1/local/search/byemail?email=xxx&limit=10
 * Response: array of AD users (displayNameAR, displayNameEN, title, department, mail, mobile, objectGUID, etc.)
 */
export const searchByEmail = async (
  email: string,
  limit: number = 10
): Promise<ADUserByEmail[]> => {
  const trimmed = email?.trim() ?? '';
  if (!trimmed || trimmed.length < 1) {
    return [];
  }
  const response = await axiosInstance.get<ADUserByEmail[] | { items?: ADUserByEmail[]; data?: ADUserByEmail[] }>(
    '/api/v1/local/search/byemail',
    { params: { email: trimmed, limit: Math.min(Math.max(limit, 1), 1000) } }
  );
  const data = response.data;
  if (Array.isArray(data)) return data;
  const items = data?.items ?? data?.data ?? [];
  return Array.isArray(items) ? items : [];
};
