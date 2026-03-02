import { useMemo } from 'react';
import { useAuth } from '@/modules/auth';
import { getNavigationItemsForUser, getDefaultRouteForUser, getUserUseCaseCodes } from '../utils/useCaseConfig';

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


