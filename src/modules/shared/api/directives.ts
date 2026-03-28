/**
 * Shared API for Minister Directives – used by UC-02, UC-19.
 * Centralizes list, take, and request-meeting calls.
 */
import { getAuthToken } from '@/modules/auth/utils/tokenGetter';
import type {
  DirectiveType,
  ImportanceLevel,
  PriorityLevel,
  DirectiveStatus,
  SchedulingOfficerStatus,
} from '@/modules/shared/types/minister-directive-enums';

const APP_BASE =
  (import.meta.env.VITE_APP_BASE_URL_MINISTER as string) ||
  'https://execution-system.momrahai.com';
const BASE = `${APP_BASE.replace(/\/$/, '')}/api`;

async function headers(): Promise<HeadersInit> {
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = await getAuthToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

/* ── Types ── */

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
  due_duration_unit?: 'HOUR' | 'DAY' | null;
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

export interface ListDirectivesParams {
  skip?: number;
  limit?: number;
  directive_type?: DirectiveType;
  importance?: ImportanceLevel;
  priority?: PriorityLevel;
  status?: DirectiveStatus;
  scheduling_officer_status?: SchedulingOfficerStatus;
}

/* ── Endpoints ── */

export async function listDirectives(
  params: ListDirectivesParams = {},
): Promise<DirectivesListResponse> {
  const url = new URL(`${BASE}/minister-directives`);
  if (params.skip != null) url.searchParams.set('skip', String(params.skip));
  if (params.limit != null) url.searchParams.set('limit', String(params.limit));
  if (params.directive_type) url.searchParams.set('directive_type', params.directive_type);
  if (params.importance) url.searchParams.set('importance', params.importance);
  if (params.priority) url.searchParams.set('priority', params.priority);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.scheduling_officer_status)
    url.searchParams.set('scheduling_officer_status', params.scheduling_officer_status);

  const res = await fetch(url.toString(), { method: 'GET', headers: await headers() });

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

export async function takeDirective(directiveId: string): Promise<void> {
  const res = await fetch(`${BASE}/minister-directives/${directiveId}/take-directive`, {
    method: 'POST',
    headers: await headers(),
    body: '{}',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Take directive error: ${res.status} ${text.slice(0, 200)}`);
  }
}

export async function requestMeetingFromDirective(directiveId: string): Promise<void> {
  const res = await fetch(`${BASE}/minister-directives/${directiveId}/request-meeting`, {
    method: 'POST',
    headers: await headers(),
    body: '{}',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request meeting error: ${res.status} ${text.slice(0, 200)}`);
  }
}
