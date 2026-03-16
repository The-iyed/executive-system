import { useQuery } from "@tanstack/react-query";
import { getLegislatorConversation } from "@gl/api/legislator/conversations";
import { queryKeys } from "@gl/api/queryKeys";
import type { Conversation } from "@gl/api/types";

export function useConversation(conversationId: string | undefined) {
  return useQuery<Conversation>({
    queryKey: queryKeys.legislator.conversation(conversationId || ""),
    queryFn: () => {
      if (!conversationId) throw new Error("Conversation ID is required");
      return getLegislatorConversation(conversationId);
    },
    enabled: !!conversationId,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
