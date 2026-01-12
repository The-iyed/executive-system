import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@sanad-ai/api';
import type {
  GetConversationsResponse,
  GetMessagesResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  UpdateConversationRequest,
  UpdateConversationResponse,
  SendMessageStreamRequest,
  StreamEvent,
} from '@sanad-ai/api';
import { sendStreamingMessage } from '@sanad-ai/api';

export interface LegislatorQueriesConfig {
  apiClient: ApiClient;
}

export const createLegislatorQueries = (config: LegislatorQueriesConfig) => {
  const baseURL = config.apiClient.getBaseURL();

  /**
   * Get all conversations
   */
  const useConversations = (params?: { limit?: number; offset?: number; sort_by?: string; user_id?: string }) => {
    return useQuery({
      queryKey: ['legislator', 'conversations', params],
      queryFn: async () => {
        const response = await config.apiClient.callApp<
          { limit?: number; offset?: number; sort_by?: string; user_id?: string },
          GetConversationsResponse
        >('sanad-ai', 'legislator', 'getConversations', params);
        return response;
      },
    });
  };

  /**
   * Get messages for a conversation
   */
  const useMessages = (
    conversationId: string,
    params?: { limit?: number; offset?: number }
  ) => {
    return useQuery({
      queryKey: ['legislator', 'conversations', conversationId, 'messages', params],
      queryFn: async () => {
        // Use the client directly to handle path parameters
        const client = config.apiClient.getClient();
        const url = `${baseURL}/legislator/conversations/${conversationId}/messages`;
        const response = await client.get<GetMessagesResponse>(url, { params });
        return response.data;
      },
      enabled: !!conversationId,
    });
  };

  /**
   * Create a new conversation
   */
  const useCreateConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreateConversationRequest) => {
        const response = await config.apiClient.callApp<
          CreateConversationRequest,
          CreateConversationResponse
        >('sanad-ai', 'legislator', 'createConversation', data);
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['legislator', 'conversations'] });
      },
    });
  };

  /**
   * Update a conversation
   */
  const useUpdateConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: UpdateConversationRequest & { conversation_id: string }) => {
        const { conversation_id, ...body } = data;
        const client = config.apiClient.getClient();
        const url = `${baseURL}/legislator/conversations/${conversation_id}`;
        const response = await client.patch<UpdateConversationResponse>(url, body);
        return response.data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['legislator', 'conversations'] });
        queryClient.invalidateQueries({
          queryKey: ['legislator', 'conversations', variables.conversation_id],
        });
      },
    });
  };

  /**
   * Delete a conversation
   */
  const useDeleteConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (conversationId: string) => {
        const client = config.apiClient.getClient();
        const url = `${baseURL}/legislator/conversations/${conversationId}`;
        await client.delete(url);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['legislator', 'conversations'] });
      },
    });
  };

  /**
   * Send a streaming message
   * Returns a function that starts the stream and handles events
   */
  const sendStreamingMessageFn = async (
    conversationId: string,
    request: SendMessageStreamRequest,
    callbacks: {
      onEvent: (event: StreamEvent) => void;
      onError?: (error: Error) => void;
      onClose?: () => void;
    }
  ) => {
    const client = config.apiClient.getClient();
    const basicAuth = config.apiClient.getBasicAuth();
    const streamClient = await sendStreamingMessage(
      client,
      baseURL,
      conversationId,
      request,
      {
        ...callbacks,
        onClose: () => {
          if (callbacks.onClose) {
            callbacks.onClose();
          }
        },
      },
      basicAuth
    );
    return streamClient;
  };

  return {
    useConversations,
    useMessages,
    useCreateConversation,
    useUpdateConversation,
    useDeleteConversation,
    sendStreamingMessage: sendStreamingMessageFn,
  };
};

