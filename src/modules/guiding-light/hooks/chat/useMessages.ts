import { useInfiniteQuery } from "@tanstack/react-query";
import { getLegislatorMessages } from "@gl/api/legislator/conversations";
import { queryKeys } from "@gl/api/queryKeys";
import { MESSAGES_PAGE_LIMIT } from "@gl/api/constants";
import type { MessagesResponse } from "@gl/api/types";

export function useMessages(
  conversationId: string | undefined,
  limit: number = MESSAGES_PAGE_LIMIT,
  enabled = true
) {
  return useInfiniteQuery<MessagesResponse>({
    queryKey: queryKeys.legislator.messages(conversationId || "", { limit }),
    queryFn: ({ pageParam = 0 }) => {
      if (!conversationId) throw new Error("Conversation ID is required");
      return getLegislatorMessages(conversationId, {
        limit,
        offset: pageParam as number,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.messages.length,
        0
      );
      if (totalLoaded >= lastPage.total) return undefined;
      return totalLoaded;
    },
    initialPageParam: 0,
    enabled: enabled && !!conversationId,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
