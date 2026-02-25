import { RouteProps } from 'react-router-dom';
import { Fragment, lazy } from 'react';
import { PATH } from './paths';
import { AuthGuard } from '@shared/guards';

type RouteConfig = {
  exact: boolean | null;
  path: string;
  component: React.ComponentType<any>;
  guard?: React.ComponentType<any> | typeof Fragment | any;
  layout?: React.ComponentType<any> | typeof Fragment;
  useCase?: string;
} & RouteProps;

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.HOME,
    component: lazy(() => import('../pages')),
    layout: Fragment,
    useCase: 'UC-10',
  },
  // Wildcard route to catch all sub-routes under /uc10
  {
    exact: false,
    guard: AuthGuard,
    path: PATH.ROOT + '/*',
    component: lazy(() => import('../pages')),
    layout: Fragment,
    useCase: 'UC-10',
  },
];

export default routes;
