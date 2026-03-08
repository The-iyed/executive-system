import axiosInstance from '../utils/axios';
import { setTokens } from '../utils/token';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: Array<{
    code: string;
    name: string;
  }>;
  use_cases?: string[];
  is_active: boolean;
}

export interface UserResponse {
  data: User;
}

// Login API
export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/api/auth/login', payload);
  const { access_token } = response.data;
  setTokens(access_token);
  return response.data;
};

// Get current user API
export const getCurrentUserApi = async (): Promise<User> => {
  const response = await axiosInstance.get<User | UserResponse>('/api/auth/me');
  // Handle both response structures: direct user object or wrapped in data
  if ('data' in response.data && typeof response.data.data === 'object') {
    return response.data.data;
  }
  return response.data as User;
};