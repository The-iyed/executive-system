import axiosInstance from "@/modules/auth/utils/axios";

export interface GetUsersParams {
  search?: string;
  role_code?: string;
  user_type?: string;
  skip?: number;
  limit?: number;
}

export interface UserApiResponse {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  position?: string | null;
  phone_number?: string | null;
  role_ids?: string[];
  permission_ids?: string[];
  is_active?: boolean;
  [key: string]: any;
}

export interface UsersListResponse {
  items: UserApiResponse[];
  total: number;
  skip: number;
  limit: number;
  has_next?: boolean;
  has_previous?: boolean;
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

export const searchUsersByEmail = async (
  email: string,
  skip?: number,
  limit?: number
): Promise<UsersListResponse> => {
  const queryParams = new URLSearchParams();

  const trimmedEmail = email.trim();
  if (trimmedEmail) {
    queryParams.append('email', trimmedEmail);
  }
  if (skip !== undefined) {
    queryParams.append('skip', skip.toString());
  }
  if (limit !== undefined) {
    queryParams.append('limit', limit.toString());
  }

  const url =
    queryParams.toString().length > 0
      ? `/api/v1/local/search/byemail?${queryParams.toString()}`
      : `/api/v1/local/search/byemail`;

  const response = await axiosInstance.get<unknown>(url);
  const data = response.data as any;

  if (Array.isArray(data)) {
    return {
      items: data as UserApiResponse[],
      total: data.length,
      skip: skip ?? 0,
      limit: limit ?? data.length,
      has_next: false,
      has_previous: false,
    };
  }

  return data as UsersListResponse;
};