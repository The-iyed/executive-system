/**
 * UC19 Minister Directives API client.
 */
import { getAuthToken } from '@/modules/auth/utils/tokenGetter';
import type {
  DirectiveType,
  ImportanceLevel,
  PriorityLevel,
  DurationUnit,
  DirectiveStatus,
  SchedulingOfficerStatus,
} from '@/modules/shared/types/minister-directive-enums';

export type { DirectiveType, ImportanceLevel, PriorityLevel, DurationUnit, DirectiveStatus, SchedulingOfficerStatus };

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

export interface MinisterDirective {
  id: string;
  title: string;
  status: DirectiveStatus;
  scheduling_officer_status: SchedulingOfficerStatus;
  directive_type?: DirectiveType;
  voice_note_path?: string | null;
  voice_play_url?: string | null;
  voice_play_url_expires_in_minutes?: number | null;
  responsible_user?: string | null;
  importance?: ImportanceLevel;
  priority?: PriorityLevel;
  due_duration_enabled?: boolean;
  due_duration_value?: number | null;
  due_duration_unit?: DurationUnit | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface DirectivesListResponse {
  items: MinisterDirective[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateDirectivePayload {
  title: string;
  status: string;
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
  directive_type?: DirectiveType;
  importance?: ImportanceLevel;
  priority?: PriorityLevel;
  status?: DirectiveStatus;
  scheduling_officer_status?: SchedulingOfficerStatus;
}

export async function listDirectives(
  params: ListDirectivesParams = {}
): Promise<DirectivesListResponse> {
  const url = new URL(`${BASE}/minister-directives`);
  if (params.skip != null) url.searchParams.set('skip', String(params.skip));
  if (params.limit != null) url.searchParams.set('limit', String(params.limit));
  if (params.directive_type) url.searchParams.set('directive_type', params.directive_type);
  if (params.importance) url.searchParams.set('importance', params.importance);
  if (params.priority) url.searchParams.set('priority', params.priority);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.scheduling_officer_status) url.searchParams.set('scheduling_officer_status', params.scheduling_officer_status);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: await getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List directives error: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return { items: data, total: data.length, skip: 0, limit: data.length, has_next: false, has_previous: false };
  }
  return {
    items: data.items || [],
    total: data.total || 0,
    skip: data.skip || 0,
    limit: data.limit || 10,
    has_next: data.has_next || false,
    has_previous: data.has_previous || false,
  };
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

/** POST /api/minister-directives/voice/upload — re-export shared client */
export { uploadMinisterDirectiveVoice as uploadVoiceNote } from '@/modules/shared/api/directives';
