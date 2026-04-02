import { PAGE_SIZE, axiosInstance, toError } from './config';

/** Generic user result from the email search API — used by manager select, invitees table, etc. */
export interface UserSearchResult {
  objectGUID?: string;
  id?: string;
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
  name?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  ar_name?: string | null;
}

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

