import { createEndpoint, createApiGroup, apiRegistry } from './definitions';

/** Stub types for shared chat endpoints (chat domain not used in this app) */
interface SendMessageRequest {
  message?: string;
  conversationId?: string;
}
interface SendMessageResponse {
  id?: string;
  content?: string;
}

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











