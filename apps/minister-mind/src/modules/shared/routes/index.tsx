import { Fragment, Suspense } from 'react';
import { Routes, Route, RouteProps, Navigate } from 'react-router-dom';
import { useAuth } from '@auth';
import { ScreenLoader } from '../components';
import { filterRoutesByUseCase } from '../utils/routeFilter';
import { getDefaultRouteForUser } from '../utils/useCaseConfig';
import pages from './routes';
import uc02Routes from '../../UC02/routes/routes';
import { UC02LayoutRouter } from '../../UC02/routes/UC02LayoutRouter';

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
  const { user, isInitialised, isAuthenticated } = useAuth();
  // Filter routes based on user's use cases
  const filteredRoutes = filterRoutesByUseCase(routes, user?.use_cases);
  // Exclude UC-02 routes so they are rendered inside UC02LayoutRouter (persistent layout)
  const routesWithoutUC02 = filteredRoutes.filter((route) => !UC02_PATHS.has(route.path));
  const hasUC02Access = filterRoutesByUseCase(uc02Routes, user?.use_cases).length > 0;
  const defaultRoute = getDefaultRouteForUser(user?.use_cases);

  // Show loader while auth is initializing to prevent redirect issues
  if (!isInitialised) {
    return <ScreenLoader />;
  }

  // Determine redirect target for catch-all route
  const catchAllRedirect = isAuthenticated ? defaultRoute : '/login';

  return (
    <Routes>
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
      {/* Catch-all route: redirect to login if not authenticated, otherwise to user's default route */}
      <Route
        path="*"
        element={<Navigate to={catchAllRedirect} replace />}
      />
    </Routes>
  );
};

const routes: RouteConfig[] = [...pages];

export default routes;
