/**
 * API Endpoint Definition
 */
export interface ApiEndpoint<TRequest = unknown, TResponse = unknown> {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Endpoint path (relative to base URL) */
  path: string;
  /** Optional request transformer */
  transformRequest?: (data: TRequest) => unknown;
  /** Optional response transformer */
  transformResponse?: (data: unknown) => TResponse;
}

/**
 * API Definition Group
 * Groups related endpoints together
 */
export interface ApiDefinitionGroup {
  /** Group name/namespace */
  name: string;
  /** Base path for all endpoints in this group */
  basePath?: string;
  /** Endpoints in this group */
  endpoints: Record<string, ApiEndpoint<unknown, unknown>>;
}

/**
 * API Registry
 * Centralized registry for all API definitions
 */
export class ApiRegistry {
  private sharedApis: Map<string, ApiDefinitionGroup> = new Map();
  private appApis: Map<string, Map<string, ApiDefinitionGroup>> = new Map();

  /**
   * Register shared APIs (available to all apps)
   */
  registerShared(group: ApiDefinitionGroup): void {
    this.sharedApis.set(group.name, group);
  }

  /**
   * Register app-specific APIs
   */
  registerApp(appName: string, group: ApiDefinitionGroup): void {
    if (!this.appApis.has(appName)) {
      this.appApis.set(appName, new Map());
    }
    this.appApis.get(appName)!.set(group.name, group);
  }

  /**
   * Get shared API group
   */
  getShared(groupName: string): ApiDefinitionGroup | undefined {
    return this.sharedApis.get(groupName);
  }

  /**
   * Get app-specific API group
   */
  getApp(appName: string, groupName: string): ApiDefinitionGroup | undefined {
    return this.appApis.get(appName)?.get(groupName);
  }

  /**
   * Get all shared API groups
   */
  getAllShared(): ApiDefinitionGroup[] {
    return Array.from(this.sharedApis.values());
  }

  /**
   * Get all API groups for an app
   */
  getAllApp(appName: string): ApiDefinitionGroup[] {
    return Array.from(this.appApis.get(appName)?.values() || []);
  }

  /**
   * Get endpoint from shared APIs
   */
  getSharedEndpoint(groupName: string, endpointName: string): ApiEndpoint<unknown, unknown> | undefined {
    const group = this.getShared(groupName);
    return group?.endpoints[endpointName];
  }

  /**
   * Get endpoint from app-specific APIs
   */
  getAppEndpoint(
    appName: string,
    groupName: string,
    endpointName: string
  ): ApiEndpoint<unknown, unknown> | undefined {
    const group = this.getApp(appName, groupName);
    return group?.endpoints[endpointName];
  }
}

/**
 * Global API Registry instance
 */
export const apiRegistry = new ApiRegistry();

/**
 * Helper to create an API endpoint
 */
export function createEndpoint<TRequest = unknown, TResponse = unknown>(
  method: ApiEndpoint['method'],
  path: string,
  options?: {
    transformRequest?: (data: TRequest) => unknown;
    transformResponse?: (data: unknown) => TResponse;
  }
): ApiEndpoint<TRequest, TResponse> {
  return {
    method,
    path,
    transformRequest: options?.transformRequest,
    transformResponse: options?.transformResponse,
  };
}

/**
 * Helper to create an API group
 */
export function createApiGroup(
  name: string,
  endpoints: Record<string, ApiEndpoint<any, any>>,
  basePath?: string
): ApiDefinitionGroup {
  return {
    name,
    basePath,
    endpoints: endpoints as Record<string, ApiEndpoint<unknown, unknown>>,
  };
}

