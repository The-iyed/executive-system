import { useInfiniteQuery } from "@tanstack/react-query";
import { searchMeetings } from "../../api";

const PAGE_SIZE = 10;

export interface MeetingSearchResult {
  id: number;
  original_title?: string;
  meeting_title: string;
  group_id?: number;
  [key: string]: unknown;
}
export interface MeetingSearchResponse {
  items: MeetingSearchResult[];
  total: number;
  skip: number;
  limit: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface MeetingOption {
  value: string;
  label: string;
  group_id?: number;
  original_title?: string;
  meeting_title?: string;
}

function toOption(meeting: MeetingSearchResult): MeetingOption {
  return {
    value: String(meeting?.id),
    label: meeting?.meeting_title || meeting?.original_title || '----',
    group_id: meeting?.group_id,
    original_title: meeting?.original_title,
    meeting_title: meeting?.meeting_title,
  };
}

export function useMeetingSearch(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["meetings-search", search],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await searchMeetings(search, pageParam * PAGE_SIZE, PAGE_SIZE);
      return res;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_next ? allPages.length : undefined,
    initialPageParam: 0,
    enabled,
    staleTime: 30_000,
    select: (data) => ({
      options: data.pages.flatMap((p) => p.items.map(toOption)),
      hasMore: data.pages[data.pages.length - 1]?.has_next ?? false,
    }),
  });
}
