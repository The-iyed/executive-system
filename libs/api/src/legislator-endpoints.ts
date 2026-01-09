import { createEndpoint, createApiGroup, apiRegistry } from './definitions';
import type {
  GetConversationsResponse,
  GetMessagesResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  UpdateConversationRequest,
  UpdateConversationResponse,
} from './legislator-types';

/**
 * Legislator API Endpoints
 * These are specific to the Legal Advisor application
 */
export const legislatorEndpoints = createApiGroup(
  'legislator',
  {
    // Get all conversations
    getConversations: createEndpoint<
      { limit?: number; offset?: number; sort_by?: string },
      GetConversationsResponse
    >('GET', '/legislator/conversations'),

    // Get messages for a conversation
    getMessages: createEndpoint<
      { conversation_id: string; limit?: number; offset?: number },
      GetMessagesResponse
    >('GET', '/legislator/conversations/:conversation_id/messages'),

    // Create a new conversation
    createConversation: createEndpoint<
      CreateConversationRequest,
      CreateConversationResponse
    >('POST', '/legislator/conversations'),

    // Update a conversation
    updateConversation: createEndpoint<
      UpdateConversationRequest & { conversation_id: string },
      UpdateConversationResponse
    >('PATCH', '/legislator/conversations/:conversation_id'),

    // Delete a conversation
    deleteConversation: createEndpoint<{ conversation_id: string }, void>(
      'DELETE',
      '/legislator/conversations/:conversation_id'
    ),
  },
  '/legislator'
);

/**
 * Register legislator APIs
 */
export function registerLegislatorApis(): void {
  apiRegistry.registerApp('sanad-ai', legislatorEndpoints);
}

// Auto-register when module loads
registerLegislatorApis();

