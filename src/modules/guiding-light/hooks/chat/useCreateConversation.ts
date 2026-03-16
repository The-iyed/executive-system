import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createLegislatorConversation } from "@gl/api/legislator/conversations";
import type {
  CreateConversationRequest,
  CreateConversationResponse,
  Conversation,
  ConversationsResponse,
} from "@gl/api/types";

const DEFAULT_NAME = "محادثة جديدة";

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation<
    CreateConversationResponse,
    Error,
    CreateConversationRequest
  >({
    mutationFn: (data) =>
      createLegislatorConversation({
        ...data,
        name: data.name || DEFAULT_NAME,
      }),
    onSuccess: (response) => {
      queryClient.setQueriesData<InfiniteData<ConversationsResponse>>(
        {
          predicate: (query) => {
            const key = query.queryKey;
            return (
              Array.isArray(key) &&
              key[0] === "conversations" &&
              key[1] === "legislator"
            );
          },
        },
        (oldData) => {
          if (!oldData) return oldData;
          const newConversation: Conversation = {
            conversation_id: response.conversation_id,
            name: response.name,
            thread_id: response.thread_id,
            ...(response.user_id && { user_id: response.user_id }),
            created_at: response.created_at,
            updated_at: response.updated_at,
            message_count: response.message_count,
            last_message_at: response.last_message_at,
          };
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) =>
              index === 0
                ? {
                    ...page,
                    conversations: [newConversation, ...page.conversations],
                    total: page.total + 1,
                  }
                : page
            ),
          };
        }
      );
    },
  });
}
