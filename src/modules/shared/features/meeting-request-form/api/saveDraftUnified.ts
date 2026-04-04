import { axiosInstance, toError } from './config';
import { buildStep1FormData } from '../shared/utils/buildStep1FormData';

export interface SaveDraftUnifiedParams {
  step1Data: Record<string, unknown>;
  step2FormData: FormData | null;
  invitees: Record<string, unknown>[];
  draftId?: string | null;
  is_content_updated?: boolean;
}

export interface SaveDraftUnifiedResult {
  id: string;
  status: string;
}

const ID_KEY = 'id';

function innerRecord(res: Record<string, unknown>): Record<string, unknown> | null {
  const d = res.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    return d as Record<string, unknown>;
  }
  return null;
}

function pickDraftId(res: Record<string, unknown>, fallbackId: string | null | undefined): string | undefined {
  const inner = innerRecord(res);
  const candidates: unknown[] = [
    res[ID_KEY],
    res.draft_id,
    inner?.[ID_KEY],
    inner?.draft_id,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
    if (typeof c === 'number' && !Number.isNaN(c)) return String(c);
  }
  if (typeof fallbackId === 'string' && fallbackId.length > 0) return fallbackId;
  return undefined;
}

function pickStatus(res: Record<string, unknown>): string {
  const inner = innerRecord(res);
  const raw =
    inner?.status ??
    res.status ??
    inner?.meeting_status ??
    res.meeting_status;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim().toUpperCase();
  }
  return 'DRAFT';
}

function buildUnifiedFormData(params: SaveDraftUnifiedParams): FormData {
  const { step1Data, step2FormData, invitees, is_content_updated } = params;
  const fd = buildStep1FormData(step1Data);
  if (step2FormData) {
    step2FormData.forEach((value, key) => {
      fd.append(key, value);
    });
  }
  fd.append('invitees', JSON.stringify(invitees));
  if (is_content_updated !== undefined) {
    fd.append('is_content_updated', String(is_content_updated));
  }
  return fd;
}

/**
 * Single request replacing PATCH basic-info + PATCH content + PATCH invitees.
 * - No draftId: POST /api/meeting-requests/drafts/unified (create; same shape as former POST …/basic-info).
 * - With draftId: PATCH /api/meeting-requests/drafts/{draft_id}/unified
 */
export async function saveDraftUnified(
  params: SaveDraftUnifiedParams,
): Promise<SaveDraftUnifiedResult> {
  const { draftId } = params;
  const isEdit = !!draftId;
  const body = buildUnifiedFormData(params);

  const url = isEdit
    ? `/api/meeting-requests/drafts/${draftId}/unified`
    : '/api/meeting-requests/drafts/unified';

  try {
    const { data: res } = await axiosInstance.request<Record<string, unknown>>({
      method: isEdit ? 'PATCH' : 'POST',
      url,
      data: body,
    });

    const id = pickDraftId(res ?? {}, draftId);
    if (!id) {
      throw new Error('Invalid response format: missing draft ID');
    }
    const status = pickStatus(res ?? {});
    return { id, status };
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid response format')) throw err;
    throw toError('Failed to save draft', err);
  }
}
