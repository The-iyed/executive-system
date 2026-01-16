import { useMemo } from 'react';
import { useAuth } from '@auth';
import { getNavigationItemsForUser, getDefaultRouteForUser, getUserUseCaseCodes } from '../utils/useCaseConfig';

/**
 * Hook to get navigation items and default route based on user's use cases
 */
export const useUserNavigation = () => {
  const { user } = useAuth();

  const navigationItems = useMemo(() => {
    return getNavigationItemsForUser(user?.use_cases);
  }, [user?.use_cases]);

  const defaultRoute = useMemo(() => {
    return getDefaultRouteForUser(user?.use_cases);
  }, [user?.use_cases]);

  const useCaseCodes = useMemo(() => {
    return getUserUseCaseCodes(user?.use_cases);
  }, [user?.use_cases]);

  return {
    navigationItems,
    defaultRoute,
    useCaseCodes,
  };
};


