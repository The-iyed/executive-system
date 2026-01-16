import { Fragment } from 'react';
import { hasUseCaseAccess } from './useCaseConfig';

type RouteConfig = {
  exact: boolean | null;
  path: string;
  component: React.ComponentType<any>;
  guard?: React.ComponentType<any> | typeof Fragment | any;
  layout?: React.ComponentType<any> | typeof Fragment;
  useCase?: string; // Optional use case requirement
};

/**
 * Filter routes based on user's use cases
 * Routes without a useCase property are always included
 * Routes with a useCase property are only included if the user has access
 */
export const filterRoutesByUseCase = (
  routes: RouteConfig[],
  userUseCases?: string[]
): RouteConfig[] => {
  if (!userUseCases || userUseCases.length === 0) {
    // If user has no use cases, only return routes without useCase requirement
    return routes.filter((route) => !route.useCase);
  }

  return routes.filter((route) => {
    // Include routes without use case requirement
    if (!route.useCase) {
      return true;
    }

    // Include routes if user has access to the required use case
    return hasUseCaseAccess(userUseCases, route.useCase);
  });
};

