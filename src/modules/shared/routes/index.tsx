import { Fragment, Suspense, useEffect, useMemo } from 'react';
import { Routes, Route, RouteProps, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { ScreenLoader } from '../components';
import { filterRoutesByUseCase } from '../utils/routeFilter';
import { getDefaultRouteForUser } from '../utils/useCaseConfig';
import pages from './routes';
import { prefetchSharedRoutes } from './prefetchRoutes';
import uc02Routes from '../../UC02/routes/routes';
import { UC02LayoutRouter } from '../../UC02/routes/UC02LayoutRouter';
import { PATH as UC04_PATH } from '../../UC04/routes/paths';
import { PATH_GUIDING_LIGHT, isMinisterUser } from '../utils/useCaseConfig';
import { GuidingLightLayout } from '../../guiding-light/GuidingLightLayout';
import { MinisterGuard } from '../../guiding-light/MinisterGuard';
import RootCallback from '@/modules/auth/components/RootCallback';
import { PATH } from '@/modules/auth/routes/paths';
import { isSsoEnabled } from '@/lib/auth/ssoOrigin';
import Onboarding from '@/modules/auth/features/Onboarding';

type RouteConfig = {
  exact: boolean | null;
  path: string;
  component: React.ComponentType<any>;
  guard?: React.ComponentType<any> | typeof Fragment;
  layout?: React.ComponentType<any> | typeof Fragment;
  useCase?: string; // Optional single use case requirement
  useCases?: string[]; // Optional multiple use case codes (OR logic)
} & RouteProps;

/** Paths handled by UC02 persistent layout (so we don't render them as separate routes). */
const UC02_PATHS = new Set(uc02Routes.map((r) => r.path));

export const renderRoutes = (routes: RouteConfig[] = []) => {
  const location = useLocation();
  const pathname = location.pathname;
  const searchParams = new URLSearchParams(location.search ?? '');
  const hasCallbackParams =
    searchParams.has('code') || searchParams.has('error') || searchParams.has('state');

  // Like sanad: any URL with callback params (e.g. /?code=...&state=...) or /callback, /silent-renew → run token exchange via RootCallback
  if (pathname === '/callback' || pathname === '/silent-renew' || hasCallbackParams) {
    return <RootCallback />;
  }

  const { user, isInitialised, isAuthenticated, isSsoEnabled: ssoEnabled, refreshUser } = useAuth();
  // When /me returns is_registered: false, show onboarding until user submits verification
  const showOnboarding =
    isAuthenticated && user && user.is_registered === false;

  const isExecutiveOfficeManager =
    user?.roles?.some((r) => r.code === 'EXECUTIVE_OFFICE_MANAGER') ?? false;
  const isMinister = isMinisterUser(user?.roles);

  // Filter routes based on user's use cases (and role exclusions, e.g. /evaluation)
  let filteredRoutes = filterRoutesByUseCase(routes, user?.use_cases, user?.roles);
  // When SSO enabled, remove /login route (unauthenticated → AuthProvider redirects to IdP from /)
  if (ssoEnabled) {
    filteredRoutes = filteredRoutes.filter((r) => r.path !== PATH.LOGIN);
  }
  // Exclude UC-02 routes so they are rendered inside UC02LayoutRouter (persistent layout)
  const routesWithoutUC02 = filteredRoutes.filter((route) => !UC02_PATHS.has(route.path));
  const hasUC02Access =
    !isMinister &&
    filterRoutesByUseCase(uc02Routes, user?.use_cases, user?.roles).length > 0;
  const defaultRoute = getDefaultRouteForUser(user?.use_cases, user?.roles);

  // Show loader while auth is initializing to prevent redirect issues
  if (!isInitialised) {
    return <ScreenLoader />;
  }

  // When SSO: unauthenticated → / (AuthProvider redirects to IdP). When basic auth: redirect to /login
  const catchAllRedirect = isAuthenticated ? defaultRoute : ssoEnabled ? '/' : '/login';

  if (showOnboarding && user) {
    return (
      <Onboarding
        user={user}
        onSuccess={refreshUser}
      />
    );
  }

  return (
    <Routes>
      {/* Before UC-02 *, so /evaluation does not fall through to UC02 layout when route is role-filtered */}
      {isExecutiveOfficeManager && (
        <Route
          path={UC04_PATH.EVALUATION}
          element={<Navigate to={UC04_PATH.GUIDANCE_REQUESTS} replace />}
        />
      )}
      {/* Guiding-light: MINISTER role only */}
      {isMinister && (
        <Route
          path={`${PATH_GUIDING_LIGHT}/*`}
          element={
            <MinisterGuard>
              <Suspense fallback={<ScreenLoader />}>
                <GuidingLightLayout />
              </Suspense>
            </MinisterGuard>
          }
        />
      )}
      {routesWithoutUC02.map((route, index) => {
        const Component = route.component;
        const Guard = route?.guard || Fragment;
        const Layout = route?.layout || Fragment;

        return (
          <Route
            key={index}
            path={route.path}
            element={
              <Guard>
                <Layout>
                  <Suspense fallback={<ScreenLoader />}>
                    <Component />
                  </Suspense>
                </Layout>
              </Guard>
            }
          />
        );
      })}
      {/* UC-02 persistent layout: one Route so layout stays mounted when switching directives/calendar/etc. */}
      {hasUC02Access && (
        <Route path="*" element={<UC02LayoutRouter />} />
      )}
      {/* Catch-all route: redirect to login if not authenticated (or / when SSO for IdP redirect) */}
      <Route
        path="*"
        element={<Navigate to={catchAllRedirect} replace />}
      />
    </Routes>
  );
};

const routes: RouteConfig[] = [...pages];

export default routes;
