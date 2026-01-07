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

// React Query utilities
export {
  createQueryClient,
  createQuery,
  createMutation,
  type QueryFactoryOptions,
  type MutationFactoryOptions,
} from './react-query';

