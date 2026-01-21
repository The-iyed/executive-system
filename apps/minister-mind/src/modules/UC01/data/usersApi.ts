import axiosInstance from "@auth/utils/axios";


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
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
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