import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  basicAuth?: {
    username?: string;
    password?: string;
    authString?: string; // base64 encoded username:password
  };
}

const createBasicAuthHeader = (config: ApiClientConfig['basicAuth']): string | undefined => {
  if (!config) return undefined;

  // If authString is provided (base64 encoded), use it directly
  if (config.authString) {
    return `Basic ${config.authString}`;
  }

  // If username and password are provided, encode them
  if (config.username && config.password) {
    const credentials = `${config.username}:${config.password}`;
    const encoded = btoa(credentials);
    return `Basic ${encoded}`;
  }

  return undefined;
};

export const createApiClient = (config: ApiClientConfig = {}): AxiosInstance => {
  const basicAuthHeader = createBasicAuthHeader(config.basicAuth);
  
  const client = axios.create({
    baseURL: config.baseURL ?? '',
    timeout: config.timeout ?? 30000,
    headers: {
      'Content-Type': 'application/json',
      ...(basicAuthHeader && { Authorization: basicAuthHeader }),
      ...config.headers,
    },
  });

  client.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return client;
};

export const defaultApiClient = createApiClient();

