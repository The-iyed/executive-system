import { AxiosInstance } from 'axios';
import { ApiEndpoint, apiRegistry } from './definitions';
import { createApiClient, type ApiClientConfig } from './client';

/**
 * Enhanced API Client that uses centralized endpoint definitions
 */
export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private basicAuth?: ApiClientConfig['basicAuth'];

  constructor(config: ApiClientConfig) {
    this.client = createApiClient(config);
    this.baseURL = config.baseURL || '';
    this.basicAuth = config.basicAuth;
  }

  /**
   * Call a shared API endpoint
   */
  async callShared<TRequest = unknown, TResponse = unknown>(
    groupName: string,
    endpointName: string,
    data?: TRequest,
    config?: Parameters<typeof this.client.get>[1]
  ): Promise<TResponse> {
    const endpoint = apiRegistry.getSharedEndpoint(groupName, endpointName);
    if (!endpoint) {
      throw new Error(`Shared endpoint not found: ${groupName}.${endpointName}`);
    }

    return this.callEndpoint<TRequest, TResponse>(endpoint as ApiEndpoint<TRequest, TResponse>, data, config);
  }

  /**
   * Call an app-specific API endpoint
   */
  async callApp<TRequest = unknown, TResponse = unknown>(
    appName: string,
    groupName: string,
    endpointName: string,
    data?: TRequest,
    config?: Parameters<typeof this.client.get>[1]
  ): Promise<TResponse> {
    const endpoint = apiRegistry.getAppEndpoint(appName, groupName, endpointName);
    if (!endpoint) {
      throw new Error(
        `App endpoint not found: ${appName}.${groupName}.${endpointName}`
      );
    }

    return this.callEndpoint<TRequest, TResponse>(endpoint as ApiEndpoint<TRequest, TResponse>, data, config);
  }

  /**
   * Call an endpoint directly
   */
  private async callEndpoint<TRequest = unknown, TResponse = unknown>(
    endpoint: ApiEndpoint<TRequest, TResponse>,
    data?: TRequest,
    config?: Parameters<typeof this.client.get>[1]
  ): Promise<TResponse> {
    const url = endpoint.path.startsWith('/')
      ? `${this.baseURL}${endpoint.path}`
      : `${this.baseURL}/${endpoint.path}`;

    const requestData = endpoint.transformRequest
      ? endpoint.transformRequest(data as TRequest)
      : data;

    let response;
    switch (endpoint.method) {
      case 'GET':
        response = await this.client.get(url, { ...config, params: requestData });
        break;
      case 'POST':
        response = await this.client.post(url, requestData, config);
        break;
      case 'PUT':
        response = await this.client.put(url, requestData, config);
        break;
      case 'PATCH':
        response = await this.client.patch(url, requestData, config);
        break;
      case 'DELETE':
        response = await this.client.delete(url, { ...config, data: requestData });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${endpoint.method}`);
    }

    const responseData = endpoint.transformResponse
      ? endpoint.transformResponse(response.data)
      : response.data;

    return responseData as TResponse;
  }

  /**
   * Get the underlying axios instance for custom requests
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Get the base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Get the basic auth config
   */
  getBasicAuth(): ApiClientConfig['basicAuth'] {
    return this.basicAuth;
  }
}

/**
 * Create an enhanced API client
 */
export function createEnhancedApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

