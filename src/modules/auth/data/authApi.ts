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
  /** Arabic full name from API (e.g. GET /me). Used for onboarding display. */
  ar_name?: string;
  roles: Array<{
    code: string;
    name: string;
  }>;
  use_cases?: string[];
  is_active: boolean;
  /** When false, user must complete onboarding (verify data). API may send is_registred. */
  is_registered?: boolean;
  /** Optional from GET /me – رقم الهوية. */
  national_id?: string;
  /** Optional from GET /me – رقم الجوال. */
  phone_number?: string;
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
  const raw = response.data;
  const user = 'data' in raw && typeof raw.data === 'object' ? raw.data : (raw as User);
  // Normalize is_registered (API may send is_registred)
  const u = user as User & { is_registred?: boolean };
  if (u && 'is_registred' in u && typeof u.is_registred === 'boolean') {
    return { ...u, is_registered: u.is_registred } as User;
  }
  return user;
};