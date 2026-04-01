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
  DurationUnit,
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

async function authHeadersOnly(): Promise<HeadersInit> {
  const h: Record<string, string> = { Accept: 'application/json' };
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

export interface MinisterDirectivesListResponse {
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

/** POST /api/minister-directives — API requires `status` */
export interface CreateMinisterDirectivePayload {
  title: string;
  status: DirectiveStatus | string;
  scheduling_officer_status?: SchedulingOfficerStatus;
  directive_type?: DirectiveType;
  voice_note_path?: string;
  responsible_user?: string;
  importance?: ImportanceLevel;
  priority?: PriorityLevel;
  due_duration_enabled?: boolean;
  due_duration_value?: number;
  due_duration_unit?: DurationUnit | string;
}

/* ── Endpoints ── */

export async function listDirectives(
  params: ListDirectivesParams = {},
): Promise<MinisterDirectivesListResponse> {
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

export async function createMinisterDirective(
  payload: CreateMinisterDirectivePayload,
): Promise<MinisterDirective> {
  const res = await fetch(`${BASE}/minister-directives`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create directive error: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<MinisterDirective>;
}

/** Strip codecs etc. so multipart part type matches what validators often expect. */
function normalizeAudioMime(mime: string): string {
  const base = mime.split(';')[0].trim();
  return base || 'audio/webm';
}

/**
 * Pick a filename extension that matches the blob MIME type.
 * Forcing `.webm` while the recorder produced `audio/mp4` (common on Safari) can trigger API 422.
 */
function extensionForAudioMime(mime: string): string {
  const base = normalizeAudioMime(mime).toLowerCase();
  if (base.includes('webm')) return 'webm';
  if (base === 'audio/mp4' || base.endsWith('/mp4')) return 'm4a';
  if (base.includes('ogg')) return 'ogg';
  if (base.includes('wav')) return 'wav';
  if (base.includes('mpeg') || base === 'audio/mp3') return 'mp3';
  if (base.includes('aac')) return 'aac';
  if (base.includes('opus')) return 'opus';
  return 'webm';
}

function voiceUploadFileName(blob: Blob, fileName?: string): string {
  const ext = extensionForAudioMime(blob.type || '');
  const stem = (fileName ?? 'voice').replace(/\.[^.]+$/, '') || 'voice';
  return `${stem}.${ext}`;
}

function formatHttpError(prefix: string, status: number, text: string): string {
  const trimmed = text.slice(0, 500);
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    const d = j?.detail;
    if (d != null) {
      if (Array.isArray(d)) {
        const parts = d.map((item: { loc?: unknown[]; msg?: string }) => {
          const loc = Array.isArray(item?.loc) ? item.loc.filter(Boolean).join('.') : '';
          const msg = typeof item?.msg === 'string' ? item.msg : JSON.stringify(item);
          return loc ? `${loc}: ${msg}` : msg;
        });
        return `${prefix}: ${status} ${parts.join('; ')}`;
      }
      if (typeof d === 'string') return `${prefix}: ${status} ${d}`;
    }
  } catch {
    /* not JSON */
  }
  return `${prefix}: ${status} ${trimmed}`;
}

/** Parse `voice_note_path` from POST /minister-directives/voice/upload response */
function parseVoiceUploadPath(data: unknown): string {
  if (data == null) throw new Error('Upload voice: empty response');
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (typeof data !== 'object') throw new Error('Upload voice: unexpected response');
  const o = data as Record<string, unknown>;
  if (typeof o.voice_note_path === 'string' && o.voice_note_path.trim()) return o.voice_note_path.trim();
  if (typeof o.path === 'string' && o.path.trim()) return o.path.trim();
  if (o.data && typeof o.data === 'object') {
    const d = o.data as Record<string, unknown>;
    if (typeof d.voice_note_path === 'string' && d.voice_note_path.trim()) return d.voice_note_path.trim();
    if (typeof d.path === 'string' && d.path.trim()) return d.path.trim();
  }
  throw new Error(`Upload voice: could not read voice_note_path from response: ${JSON.stringify(data)}`);
}

/**
 * POST /api/minister-directives/voice/upload — returns storage path for `voice_note_path` on create.
 * Multipart field name must be `file` (per OpenAPI). Filename extension is aligned with blob MIME
 * so servers that validate format do not return 422 for Safari `audio/mp4` + `.webm` mismatches.
 */
export async function uploadMinisterDirectiveVoice(
  audioBlob: Blob,
  fileName = 'voice.webm',
): Promise<string> {
  const name = voiceUploadFileName(audioBlob, fileName);
  const mime = normalizeAudioMime(audioBlob.type || 'audio/webm');
  const file = new File([audioBlob], name, { type: mime });

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE}/minister-directives/voice/upload`, {
    method: 'POST',
    headers: await authHeadersOnly(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(formatHttpError('Upload voice error', res.status, text));
  }
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return parseVoiceUploadPath(data);
}
