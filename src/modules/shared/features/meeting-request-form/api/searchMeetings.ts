import type { MeetingSearchResponse } from '../shared/hooks/useMeetingSearch';
import { axiosInstance, toError, PAGE_SIZE } from './config';

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

