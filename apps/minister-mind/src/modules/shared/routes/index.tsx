import { Fragment, Suspense } from 'react';
import { Routes, Route, RouteProps } from 'react-router-dom';
import { ScreenLoader } from '../components';
import pages from './routes';

type RouteConfig = {
  exact: boolean | null;
  path: string;
  component: React.ComponentType<any>;
  guard?: React.ComponentType<any> | typeof Fragment;
  layout?: React.ComponentType<any> | typeof Fragment;
} & RouteProps;

export const renderRoutes = (routes: RouteConfig[] = []) => (
  <Routes>
    {routes.map((route, index) => {
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
  </Routes>
);

const routes: RouteConfig[] = [...pages];

export default routes;
