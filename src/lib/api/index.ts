// Core API client
export { createApiClient, defaultApiClient, type ApiClientConfig } from './client';

// Enhanced API client with centralized definitions
export { ApiClient, createEnhancedApiClient } from './api-client';

// API definitions and registry
export {
  ApiRegistry,
  apiRegistry,
  createEndpoint,
  createApiGroup,
  type ApiEndpoint,
  type ApiDefinitionGroup,
} from './definitions';

// Shared API endpoints
export {
  sharedChatEndpoints,
  sharedAuthEndpoints,
  registerSharedApis,
} from './endpoints';

// Legislator API endpoints and types
export {
  legislatorEndpoints,
  registerLegislatorApis,
} from './legislator-endpoints';
export type {
  DocumentReference,
  MessageMetadata,
  LegislatorMessage,
  Conversation as LegislatorConversation,
  GetConversationsResponse,
  GetMessagesResponse,
  CreateConversationRequest,
  CreateConversationResponse,
  UpdateConversationRequest,
  UpdateConversationResponse,
  SendMessageStreamRequest,
  StreamEvent,
  ParsedContent,
} from './legislator-types';
export { sendStreamingMessage, type StreamController } from './legislator-client';

// React Query utilities
export {
  createQueryClient,
  createQuery,
  createMutation,
  type QueryFactoryOptions,
  type MutationFactoryOptions,
} from './react-query';

