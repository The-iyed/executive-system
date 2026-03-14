import { axiosInstance, toError } from './config';

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

