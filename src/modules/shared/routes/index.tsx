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

/** Catch-all: authenticated users → home; unauthenticated → login with ?redirect= so deep links work after sign-in. */
function CatchAllRedirect({
  defaultRoute,
  isAuthenticated,
  ssoEnabled,
}: {
  defaultRoute: string;
  isAuthenticated: boolean;
  ssoEnabled: boolean;
}) {
  const location = useLocation();
  if (isAuthenticated) {
    return <Navigate to={defaultRoute} replace />;
  }
  if (ssoEnabled) {
    return <Navigate to="/" replace />;
  }
  const attempted = `${location.pathname}${location.search ?? ''}`;
  if (attempted === PATH.LOGIN || attempted.startsWith(`${PATH.LOGIN}?`)) {
    return <Navigate to={PATH.LOGIN} replace />;
  }
  const redirectParam = encodeURIComponent(attempted);
  return <Navigate to={`${PATH.LOGIN}?redirect=${redirectParam}`} replace />;
}

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

  // Memoize route filtering to avoid recalculating on every render
  const filteredRoutes = useMemo(() => {
    let result = filterRoutesByUseCase(routes, user?.use_cases, user?.roles);
    if (ssoEnabled) {
      result = result.filter((r) => r.path !== PATH.LOGIN);
    }
    return result;
  }, [routes, user?.use_cases, user?.roles, ssoEnabled]);

  const routesWithoutUC02 = useMemo(
    () => filteredRoutes.filter((route) => !UC02_PATHS.has(route.path)),
    [filteredRoutes]
  );

  const hasUC02Access = useMemo(
    () => !isMinister && filterRoutesByUseCase(uc02Routes, user?.use_cases, user?.roles).length > 0,
    [isMinister, user?.use_cases, user?.roles]
  );

  const defaultRoute = useMemo(
    () => getDefaultRouteForUser(user?.use_cases, user?.roles),
    [user?.use_cases, user?.roles]
  );

  // Prefetch all route chunks once authenticated
  useEffect(() => {
    if (isInitialised && isAuthenticated) {
      prefetchSharedRoutes();
    }
  }, [isInitialised, isAuthenticated]);

  // Show loader while auth is initializing to prevent redirect issues
  if (!isInitialised) {
    return <ScreenLoader />;
  }

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
      {/* Catch-all: login + ?redirect= for deep links (e.g. /uc13/business-cards/30) */}
      <Route
        path="*"
        element={
          <CatchAllRedirect
            defaultRoute={defaultRoute}
            isAuthenticated={isAuthenticated}
            ssoEnabled={ssoEnabled}
          />
        }
      />
    </Routes>
  );
};

const routes: RouteConfig[] = [...pages];

export default routes;
