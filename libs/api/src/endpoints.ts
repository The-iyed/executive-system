import { createEndpoint, createApiGroup, apiRegistry } from './definitions';
import type { SendMessageRequest, SendMessageResponse } from '@sanad-ai/chat/domain';

/**
 * Shared Chat API Endpoints
 * These are available to all apps
 */
export const sharedChatEndpoints = createApiGroup(
  'chat',
  {
    sendMessage: createEndpoint<SendMessageRequest, SendMessageResponse>(
      'POST',
      '/chat/message'
    ),
    getMessages: createEndpoint<{ conversationId: string }, SendMessageResponse[]>(
      'GET',
      '/chat/messages'
    ),
    getConversations: createEndpoint<void, Array<{ id: string; title: string }>>(
      'GET',
      '/chat/conversations'
    ),
  },
  '/chat'
);

/**
 * Shared Auth API Endpoints
 * These are available to all apps
 */
export const sharedAuthEndpoints = createApiGroup(
  'auth',
  {
    login: createEndpoint<{ username: string; password: string }, { token: string }>(
      'POST',
      '/auth/login'
    ),
    logout: createEndpoint<void, void>('POST', '/auth/logout'),
    refreshToken: createEndpoint<{ refreshToken: string }, { token: string }>(
      'POST',
      '/auth/refresh'
    ),
  },
  '/auth'
);

/**
 * Register all shared APIs
 */
export function registerSharedApis(): void {
  apiRegistry.registerShared(sharedChatEndpoints);
  apiRegistry.registerShared(sharedAuthEndpoints);
}

// Auto-register shared APIs when module loads
registerSharedApis();






