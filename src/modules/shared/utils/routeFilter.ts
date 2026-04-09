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
  /** If user has any of these role codes, route is not registered (e.g. calendar for executive office manager) */
  excludeRoleCodes?: string[];
  /** If set, user must have at least one of these role codes to access the route */
  requiresRoleCodes?: string[];
};

function userHasExcludedRole(
  userRoles: Array<{ code: string }> | undefined,
  excludeRoleCodes?: string[]
): boolean {
  if (!excludeRoleCodes?.length || !userRoles?.length) return false;
  const codes = new Set(userRoles.map((r) => r.code));
  return excludeRoleCodes.some((c) => codes.has(c));
}

/**
 * Filter routes based on user's use cases
 * Routes without a useCase property are always included
 * Routes with a useCase property are only included if the user has access
 */
export const filterRoutesByUseCase = (
  routes: RouteConfig[],
  userUseCases?: string[],
  userRoles?: Array<{ code: string }>
): RouteConfig[] => {
  const byUseCase = (() => {
    if (!userUseCases || userUseCases.length === 0) {
      return routes.filter(
        (route) => !route.useCase && (!route.useCases || route.useCases.length === 0)
      );
    }
    return routes.filter((route) => {
      const hasMultipleUseCases = Array.isArray(route.useCases) && route.useCases.length > 0;
      const hasSingleUseCase = !!route.useCase;
      if (!hasSingleUseCase && !hasMultipleUseCases) {
        return true;
      }
      if (hasMultipleUseCases) {
        return route.useCases!.some((code) => hasUseCaseAccess(userUseCases, code));
      }
      return hasUseCaseAccess(userUseCases, route.useCase!);
    });
  })();

  return byUseCase.filter(
    (route) => !userHasExcludedRole(userRoles, route.excludeRoleCodes)
  );
};

