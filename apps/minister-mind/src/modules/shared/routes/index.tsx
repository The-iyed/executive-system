import { Fragment, Suspense } from 'react';
import { Routes, Route, RouteProps, Navigate } from 'react-router-dom';
import { useAuth } from '@auth';
import { ScreenLoader } from '../components';
import { filterRoutesByUseCase } from '../utils/routeFilter';
import { getDefaultRouteForUser } from '../utils/useCaseConfig';
import pages from './routes';

type RouteConfig = {
  exact: boolean | null;
  path: string;
  component: React.ComponentType<any>;
  guard?: React.ComponentType<any> | typeof Fragment;
  layout?: React.ComponentType<any> | typeof Fragment;
  useCase?: string; // Optional single use case requirement
  useCases?: string[]; // Optional multiple use case codes (OR logic)
} & RouteProps;

export const renderRoutes = (routes: RouteConfig[] = []) => {
  const { user, isInitialised, isAuthenticated } = useAuth();
  // Filter routes based on user's use cases
  const filteredRoutes = filterRoutesByUseCase(routes, user?.use_cases);
  const defaultRoute = getDefaultRouteForUser(user?.use_cases);

  // Show loader while auth is initializing to prevent redirect issues
  if (!isInitialised) {
    return <ScreenLoader />;
  }

  // Determine redirect target for catch-all route
  const catchAllRedirect = isAuthenticated ? defaultRoute : '/login';

  return (
    <Routes>
      {filteredRoutes.map((route, index) => {
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
