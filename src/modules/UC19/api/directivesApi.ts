/**
 * UC19 Minister Directives API client.
 * Re-uses the same base URL and auth as guiding-light minister-directives.
 */
import { getAuthToken } from '@/modules/auth/utils/tokenGetter';

const APP_BASE =
  (import.meta.env.VITE_APP_BASE_URL_MINISTER as string) ||
  'https://execution-system.momrahai.com';
const BASE = `${APP_BASE.replace(/\/$/, '')}/api`;

async function getHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = await getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Types
export type DirectiveType = 'SCHEDULING' | 'GENERAL' | 'EXECUTIVE_OFFICE' | 'GOVERNMENT_CENTER';
export type ImportanceLevel = 'IMPORTANT' | 'NORMAL';
export type PriorityLevel = 'URGENT' | 'NORMAL';
export type DurationUnit = 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
export type DirectiveStatus = 'TAKEN' | 'ADOPTED';
export type SchedulingOfficerStatus = 'OPEN' | 'CLOSED';

export interface MinisterDirective {
  id: string;
  title: string;
  status: DirectiveStatus;
  scheduling_officer_status: SchedulingOfficerStatus;
  directive_type?: DirectiveType;
  voice_note_path?: string;
  responsible_user?: string;
  importance?: ImportanceLevel;
  priority?: PriorityLevel;
  due_duration_enabled?: boolean;
  due_duration_value?: number;
  due_duration_unit?: DurationUnit;
  created_at: string;
  updated_at: string;
}

export interface CreateDirectivePayload {
  title: string;
  status?: string;
  scheduling_officer_status?: SchedulingOfficerStatus;
  directive_type?: DirectiveType;
  voice_note_path?: string;
  responsible_user?: string;
  importance?: ImportanceLevel;
  priority?: PriorityLevel;
  due_duration_enabled?: boolean;
  due_duration_value?: number;
  due_duration_unit?: string;
}

export interface ListDirectivesParams {
  skip?: number;
  limit?: number;
}

export async function listDirectives(
  params: ListDirectivesParams = {}
): Promise<MinisterDirective[]> {
  const url = new URL(`${BASE}/minister-directives`);
  if (params.skip != null) url.searchParams.set('skip', String(params.skip));
  if (params.limit != null) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: await getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List directives error: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

export async function createDirective(
  payload: CreateDirectivePayload
): Promise<MinisterDirective> {
  const res = await fetch(`${BASE}/minister-directives`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create directive error: ${res.status} ${text.slice(0, 200)}`);
  }

  return res.json();
}
