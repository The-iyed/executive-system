import axiosInstance from '@/modules/auth/utils/axios';
import { type UsersListResponse } from './shared/hooks/useManagerSearch';
import { MeetingSearchResponse } from './shared/hooks/useMeetingSearch';

/** Normalize axios error to a plain Error with a message for consistent handling. */
function toError(message: string, err: unknown): Error {
  if (err instanceof Error) return err;
  const data = typeof err === 'object' && err !== null && 'response' in err
    ? (err as { response?: { status?: number; data?: unknown } }).response
    : null;
  const status = data?.status;
  const detail = data?.data != null && typeof (data.data as { detail?: string }).detail === 'string'
    ? (data.data as { detail: string }).detail
    : null;
  const msg = status != null
    ? `${message}: HTTP ${status}${detail ? ` — ${detail}` : ''}`
    : message;
  return new Error(msg);
}

// ── Types ────────────────────────────────────────────────────────────────────

/** Generic user result from the email search API — used by manager select, invitees table, etc. */
export interface UserSearchResult {
  objectGUID: string;
  displayName: string;
  displayNameAR: string | null;
  displayNameEN: string | null;
  givenName: string;
  cn: string;
  sn: string;
  mail: string;
  title: string | null;
  department: string | null;
  company: string | null;
  mobile: string | null;
  is_disabled: number;
}

// ── API functions ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export async function searchUsersByEmail(
  email: string,
  page: number,
): Promise<{ items: UserSearchResult[]; hasMore: boolean }> {
  const skip = page * PAGE_SIZE;
  const query = email || 'a'; // default search to "a" when empty

  try {
    const { data } = await axiosInstance.get<unknown>(
      '/api/v1/local/search/byemail',
      { params: { email: query, skip, limit: PAGE_SIZE } },
    );
    const items: UserSearchResult[] = Array.isArray(data)
      ? data
      : Array.isArray((data as Record<string, unknown>)?.items)
        ? (data as Record<string, unknown>).items as UserSearchResult[]
        : [];
    return { items, hasMore: items.length === PAGE_SIZE };
  } catch (err) {
    throw toError('Manager search failed', err);
  }
}

// ── Users API (Meeting Owner) ───────────────────────────────────────────────
export interface GetUsersParams {
  search?: string;
  role_code?: string;
  user_type?: string;
  skip?: number;
  limit?: number;
}

export async function getUsers(params: GetUsersParams = {}): Promise<UsersListResponse> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.role_code) queryParams.append("role_code", params.role_code);
  if (params.user_type) queryParams.append("user_type", params.user_type);
  if (params.skip !== undefined) queryParams.append("skip", params.skip.toString());
  if (params.limit !== undefined) queryParams.append("limit", params.limit.toString());

  try {
    const { data } = await axiosInstance.get<UsersListResponse>(
      `/api/meeting-requests/users?${queryParams.toString()}`,
    );
    return data;
  } catch (err) {
    throw toError('Failed to fetch users', err);
  }
}

export interface DirectiveSearchResult {
  id: string;
  action_number?: string;
  title?: string;
  due_date?: string;
  status?: string;
  is_completed?: boolean;
  meeting_id?: number;
  assignees?: string[];
  directive_text?: string;
  [key: string]: unknown;
}

interface DirectivesApiResponse {
  current_directives?: {
    items: DirectiveSearchResult[];
    total: number;
    has_next: boolean;
  };
  previous_directives?: {
    items: DirectiveSearchResult[];
    total: number;
    has_next: boolean;
  };
}

export async function searchDirectives(
  skip: number,
  limit: number,
): Promise<{ items: DirectiveSearchResult[]; hasMore: boolean; total: number }> {
  try {
    const { data } = await axiosInstance.get<DirectivesApiResponse>(
      '/api/scheduling/directives',
      { params: { skip, limit } },
    );
    const currentItems = data.current_directives?.items ?? [];
    const previousItems = data.previous_directives?.items ?? [];
    const items = [...currentItems, ...previousItems];
    const hasMore = data.current_directives?.has_next || data.previous_directives?.has_next || false;
    const total = (data.current_directives?.total ?? 0) + (data.previous_directives?.total ?? 0);
    return { items, hasMore, total };
  } catch (err) {
    throw toError('Directives search failed', err);
  }
}

export async function fetchMeetingDraft(meetingId: string): Promise<Record<string, unknown>> {
  try {
    const { data } = await axiosInstance.get<Record<string, unknown>>(
      `/api/meeting-requests/drafts/${meetingId}`,
    );
    return data;
  } catch (err) {
    throw toError('Failed to fetch draft', err);
  }
}

interface EditableFieldsApiResponse {
  editable_fields?: unknown;
  [key: string]: unknown;
}

export async function fetchEditableFields(meetingId: string): Promise<string[]> {
  try {
    const { data } = await axiosInstance.get<EditableFieldsApiResponse>(
      `/api/meetings/my/${meetingId}`,
    );
    const fields = Array.isArray(data?.editable_fields)
      ? data.editable_fields.filter((field): field is string => typeof field === 'string')
      : [];
    return fields;
  } catch (err) {
    throw toError('Failed to fetch editable fields', err);
  }
}

export interface MeetingDraftWithEditableFields {
  draft: Record<string, unknown>;
  editableFields: string[];
}

/**
 * Fetches both draft details and editable fields in parallel.
 * If either request fails, the entire operation fails (Promise.all).
 */
export async function fetchMeetingDraftWithEditableFields(
  meetingId: string,
): Promise<MeetingDraftWithEditableFields> {
  const [draft, editableFields] = await Promise.all([
    fetchMeetingDraft(meetingId),
    fetchEditableFields(meetingId),
  ]);
  return { draft, editableFields };
}

// ── Draft step APIs ─────────────────────────────────────────────────────────

const BASIC_INFO_RESPONSE_ID_KEY = 'id';

/**
 * Save or update basic info (Step 1) for a meeting draft.
 * POST for new drafts, PATCH for existing ones.
 * Returns the draft ID.
 */
export async function saveDraftBasicInfo(
  payload: FormData,
  draftId?: string | null,
): Promise<string> {
  const isEdit = !!draftId;
  const url = isEdit
    ? `/api/meeting-requests/drafts/${draftId}/basic-info`
    : '/api/meeting-requests/drafts/basic-info';

  try {
    const { data } = await axiosInstance.request<Record<string, unknown>>({
      method: isEdit ? 'PATCH' : 'POST',
      url,
      data: payload,
    });
    const newDraftId = data?.[BASIC_INFO_RESPONSE_ID_KEY] ?? draftId;
    if (!newDraftId) {
      throw new Error('Invalid response format: missing draft ID');
    }
    return newDraftId as string;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid response format')) throw err;
    throw toError('Failed to save basic info', err);
  }
}

/**
 * Save content (Step 2) for a meeting draft.
 * Accepts a pre-built FormData from the Step2Form.
 */
export async function saveDraftContent(
  draftId: string,
  payload: FormData,
): Promise<void> {
  try {
    await axiosInstance.patch(`/api/meeting-requests/drafts/${draftId}/content`, payload);
  } catch (err) {
    throw toError('Failed to save content', err);
  }
}

/**
 * Save invitees (Step 3) for a meeting draft.
 */
export async function saveDraftInvitees(
  draftId: string,
  invitees: Record<string, unknown>[],
): Promise<{ status: string }> {
  try {
    const { data } = await axiosInstance.patch<{ status?: string }>(
      `/api/meeting-requests/drafts/${draftId}/invitees`,
      { invitees },
    );
    return { status: data?.status ?? 'DRAFT' };
  } catch (err) {
    throw toError('Failed to save invitees', err);
  }
}

// ── Submit / Resubmit APIs ──────────────────────────────────────────────────

export async function submitDraft(draftId: string): Promise<unknown> {
  try {
    const { data } = await axiosInstance.post(`/api/meeting-requests/drafts/${draftId}/submit`);
    return data;
  } catch (err) {
    throw toError('Failed to submit draft', err);
  }
}

export async function resubmitToScheduling(draftId: string): Promise<unknown> {
  try {
    const { data } = await axiosInstance.post(
      `/api/meeting-requests/drafts/${draftId}/resubmit-to-scheduling`,
    );
    return data;
  } catch (err) {
    throw toError('Failed to resubmit to scheduling', err);
  }
}

export async function resubmitToContent(draftId: string): Promise<unknown> {
  try {
    const { data } = await axiosInstance.post(
      `/api/meeting-requests/drafts/${draftId}/resubmit-to-content`,
    );
    return data;
  } catch (err) {
    throw toError('Failed to resubmit to content', err);
  }
}

export async function searchMeetings(
  query: string,
  skip = 0,
  limit = PAGE_SIZE,
): Promise<MeetingSearchResponse> {
  const safeSkip = skip ?? 0;
  const safeLimit = Math.min(Math.max(limit ?? PAGE_SIZE, 1), 100);
  const q = query != null && query.trim() !== '' ? query.trim() : 'a';

  const params = new URLSearchParams();
  params.set('q', q);
  params.set('skip', String(safeSkip));
  params.set('limit', String(safeLimit));

  try {
    const { data } = await axiosInstance.get<MeetingSearchResponse['items'] | MeetingSearchResponse>(
      `/api/v1/business-cards/meetings-search?${params.toString()}`,
    );

    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        skip: safeSkip,
        limit: safeLimit,
        has_next: data.length === safeLimit,
        has_previous: safeSkip > 0,
      };
    }

    const payload = data as Partial<MeetingSearchResponse> & { items?: unknown };
    const items = Array.isArray(payload.items)
      ? payload.items as MeetingSearchResponse['items']
      : [];

    return {
      items,
      total: typeof payload.total === 'number' ? payload.total : items.length,
      skip: typeof payload.skip === 'number' ? payload.skip : safeSkip,
      limit: typeof payload.limit === 'number' ? payload.limit : safeLimit,
      has_next: Boolean(payload.has_next),
      has_previous: Boolean(payload.has_previous ?? safeSkip > 0),
    };
  } catch (err) {
    throw toError('Meeting search failed', err);
  }
}

// ── Scheduler: Direct Schedule (Step 1–3) ───────────────────────────────────

export async function createSchedulerStep1(payload: FormData): Promise<string> {
  try {
    const { data } = await axiosInstance.post<{ id?: string | number; meeting_id?: string | number }>(
      '/api/meeting-requests/direct-schedule/step1',
      payload,
    );
    const id = data?.id ?? data?.meeting_id;
    if (!id) {
      throw new Error('Invalid response format: missing meeting ID');
    }
    return String(id);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Invalid response format')) throw err;
    throw toError('Failed to create scheduler step 1', err);
  }
}

export async function saveSchedulerStep2Content(
  meetingId: string,
  payload: FormData,
): Promise<void> {
  try {
    await axiosInstance.put(
      `/api/meeting-requests/direct-schedule/${meetingId}/content`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  } catch (err) {
    throw toError('Failed to save scheduler step 2 content', err);
  }
}

export async function saveSchedulerStep3Invitees(
  meetingId: string,
  invitees: Record<string, unknown>[],
): Promise<void> {
  try {
    await axiosInstance.put(
      `/api/meeting-requests/direct-schedule/${meetingId}/step3`,
      { invitees },
    );
  } catch (err) {
    throw toError('Failed to save scheduler step 3 invitees', err);
  }
}