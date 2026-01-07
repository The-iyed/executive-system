import { createEndpoint, createApiGroup, apiRegistry } from '@sanad-ai/api';

/**
 * Muhallil Ahkam specific API endpoints
 * These are only available to the muhallil-ahkam app
 */
export const muhallilAhkamEndpoints = createApiGroup(
  'muhallil-ahkam',
  {
    // Example: App-specific endpoint
    getAhkamData: createEndpoint<{ id: string }, { data: string }>(
      'GET',
      '/muhallil-ahkam/data'
    ),
    updateAhkamData: createEndpoint<
      { id: string; data: string },
      { success: boolean }
    >('PUT', '/muhallil-ahkam/data'),
  },
  '/muhallil-ahkam'
);

/**
 * Register Muhallil Ahkam app-specific APIs
 */
export function registerMuhallilAhkamApis(): void {
  apiRegistry.registerApp('muhallil-ahkam', muhallilAhkamEndpoints);
}

// Auto-register when module loads
registerMuhallilAhkamApis();

