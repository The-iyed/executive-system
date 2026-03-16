import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getLegislatorConversations } from "@gl/api/legislator/conversations";
import { queryKeys } from "@gl/api/queryKeys";
import { CONVERSATIONS_PAGE_LIMIT } from "@gl/api/constants";
import type { ConversationsResponse } from "@gl/api/types";

export function useConversations(
  limit = CONVERSATIONS_PAGE_LIMIT,
  sortBy = "updated_at",
  search?: string
) {
  const baseParams = {
    limit,
    sort_by: sortBy,
    ...(search?.trim() && { search: search.trim() }),
  };
  return useInfiniteQuery<ConversationsResponse>({
    queryKey: queryKeys.legislator.conversations(baseParams),
    queryFn: ({ pageParam = 0 }) =>
      getLegislatorConversations({
        ...baseParams,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.conversations.length,
        0
      );
      if (totalLoaded >= lastPage.total) return undefined;
      return totalLoaded;
    },
    initialPageParam: 0,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateConversations() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.allConversations() }),
  };
}
