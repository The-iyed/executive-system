import axiosInstance from '@/modules/auth/utils/axios';

/** Default page size used by paginated meeting APIs. */
export const PAGE_SIZE = 10;

/** Shared axios instance configured with base URL, auth token, and headers. */
export { axiosInstance };

/** Normalize axios error to a plain Error with a message for consistent handling. */
export function toError(message: string, err: unknown): Error {
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

