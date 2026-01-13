import { QueryClient, QueryClientConfig, useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { AxiosInstance } from 'axios';

export const createQueryClient = (config: QueryClientConfig = {}): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
      ...config.defaultOptions,
    },
    ...config,
  });
};

export interface QueryFactoryOptions<TData, TError> {
  client: AxiosInstance;
  queryKey: string[];
  queryFn: () => Promise<TData>;
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>;
}

export const createQuery = <TData, TError = Error>(
  options: QueryFactoryOptions<TData, TError>
) => {
  return () => {
    return useQuery<TData, TError>({
      queryKey: options.queryKey,
      queryFn: options.queryFn,
      ...options.options,
    });
  };
};

export interface MutationFactoryOptions<TData, TVariables, TError> {
  client: AxiosInstance;
  mutationFn: (variables: TVariables) => Promise<TData>;
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>;
}

export const createMutation = <TData, TVariables, TError = Error>(
  options: MutationFactoryOptions<TData, TVariables, TError>
) => {
  return () => {
    return useMutation<TData, TError, TVariables>({
      mutationFn: options.mutationFn,
      ...options.options,
    });
  };
};






