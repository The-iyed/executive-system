import { ApiClient } from '@sanad-ai/api';
import { createMutation } from '@sanad-ai/api';
import { SendMessageRequest, SendMessageResponse, SendMessageResponseSchema } from '@sanad-ai/chat/domain';
import { safeParseResponse } from '@sanad-ai/response-parser';

export interface ChatQueriesConfig {
  apiClient: ApiClient;
}

export const createChatQueries = (config: ChatQueriesConfig) => {
  const sendMessageQuery = createMutation<SendMessageResponse, SendMessageRequest>({
    client: config.apiClient.getClient(),
    mutationFn: async (variables: SendMessageRequest) => {
      // Use centralized API definition
      const response = await config.apiClient.callShared<SendMessageRequest, SendMessageResponse>(
        'chat',
        'sendMessage',
        variables
      );
      
      const parsed = safeParseResponse(SendMessageResponseSchema, response);
      if (!parsed.success || !parsed.data) {
        throw new Error(parsed.error ?? 'Failed to parse response');
      }
      return parsed.data;
    },
  });

  return {
    sendMessage: sendMessageQuery,
  };
};

