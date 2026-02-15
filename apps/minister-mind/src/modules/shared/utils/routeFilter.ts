import { Fragment } from 'react';
import { hasUseCaseAccess } from './useCaseConfig';

type RouteConfig = {
  exact: boolean | null;
  path: string;
  component: React.ComponentType<any>;
  guard?: React.ComponentType<any> | typeof Fragment | any;
  layout?: React.ComponentType<any> | typeof Fragment;
  useCase?: string; // Optional single use case requirement
  useCases?: string[]; // Optional multiple use case codes (OR logic)
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
    // If user has no use cases, only return routes without any useCase requirements
    return routes.filter(
      (route) => !route.useCase && (!route.useCases || route.useCases.length === 0)
    );
  }

  return routes.filter((route) => {
    const hasMultipleUseCases = Array.isArray(route.useCases) && route.useCases.length > 0;
    const hasSingleUseCase = !!route.useCase;

    // Include routes without any use case requirement
    if (!hasSingleUseCase && !hasMultipleUseCases) {
      return true;
    }

    // If route specifies multiple allowed use cases, allow if user has ANY of them
    if (hasMultipleUseCases) {
      return route.useCases!.some((code) => hasUseCaseAccess(userUseCases, code));
    }

    // Fallback to single useCase check
    return hasUseCaseAccess(userUseCases, route.useCase!);
  });
};

