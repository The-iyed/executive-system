import { createEndpoint, createApiGroup, apiRegistry } from '@sanad-ai/api';

/**
 * Sanad AI specific API endpoints
 * These are only available to the sanad-ai app
 */
export const sanadAiEndpoints = createApiGroup(
  'sanad-ai',
  {
    // Example: App-specific endpoint
    getSanadData: createEndpoint<{ id: string }, { data: string }>(
      'GET',
      '/sanad-ai/data'
    ),
    updateSanadData: createEndpoint<
      { id: string; data: string },
      { success: boolean }
    >('PUT', '/sanad-ai/data'),
  },
  '/sanad-ai'
);

/**
 * Register Sanad AI app-specific APIs
 */
export function registerSanadAiApis(): void {
  apiRegistry.registerApp('sanad-ai', sanadAiEndpoints);
}

// Auto-register when module loads
registerSanadAiApis();





