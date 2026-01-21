import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers, type UserApiResponse } from '../../../data/usersApi';
import type { AsyncSelectOption } from '@sanad-ai/ui';

// PaginatedResponse type (will be exported from @sanad-ai/ui in future)
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_next?: boolean;
  has_previous?: boolean;
}

interface UseUsersOptions {
  search?: string;
  role_code?: string;
  user_type?: string;
  enabled?: boolean;
  limit?: number;
}

/**
 * Maps UserApiResponse to AsyncSelectOption format
 */
const mapUserToOption = (user: UserApiResponse): AsyncSelectOption<string> => {
  // Construct name from first_name and last_name
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';
  
  return {
    value: user.id,
    label: fullName,
    description: user.email || undefined,
  };
};

/**
 * Hook to fetch and manage users for async select
 */
export const useUsers = (options: UseUsersOptions = {}) => {
  const { search, role_code, user_type, enabled = true, limit = 10 } = options;

  const query = useQuery({
    queryKey: ['users', search, role_code, user_type, limit],
    queryFn: async () => {
      const response = await getUsers({
        search,
        role_code,
        user_type,
        skip: 0,
        limit,
      });
      return response.items.map(mapUserToOption);
    },
    enabled: enabled && !!search, // Only fetch when there's a search term
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Load options function for AsyncSelect
   * Called by AsyncSelect when dropdown opens or when user types in the search box
   * Returns paginated response to enable scroll-to-load-more functionality
   */
  const loadOptions = useMemo(
    () => async (
      searchTerm?: string,
      skip?: number,
      limitParam?: number
    ): Promise<PaginatedResponse<AsyncSelectOption<string>>> => {
      try {
        const trimmedSearch = searchTerm?.trim();
        
        // Fetch users - with search term if provided, otherwise fetch initial list
        const response = await getUsers({
          search: trimmedSearch || undefined, // Only include search if there's a term
          role_code,
          user_type,
          skip: skip || 0,
          limit: limitParam || limit,
        });

        // Return paginated response format that AsyncSelect expects
        return {
          items: response.items.map(mapUserToOption),
          total: response.total,
          skip: response.skip,
          limit: response.limit,
          has_next: response.has_next ?? false,
          has_previous: response.has_previous ?? false,
        };
      } catch (error) {
        console.error('Error loading users:', error);
        throw error;
      }
    },
    [role_code, user_type, limit]
  );

  return {
    query,
    loadOptions,
    users: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
