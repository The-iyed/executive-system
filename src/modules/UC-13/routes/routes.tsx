import { RouteProps } from 'react-router-dom';
import { Fragment, lazy } from 'react';
import { PATH } from './paths';
import { AuthGuard } from '@/modules/shared/guards';

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
    useCase: 'UC-13',
  },
  // Must be before wildcard so host renders directives (not the microremote only)
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.DIRECTIVES,
    component: lazy(() => import('../pages/DirectivesPage')),
    layout: lazy(() => import('../Layout')),
    useCase: 'UC-13',
  },
  // Wildcard route to catch all sub-routes under /uc13
  {
    exact: false,
    guard: AuthGuard,
    path: PATH.ROOT + '/*',
    component: lazy(() => import('../pages')),
    layout: Fragment,
    useCase: 'UC-13',
  },
];

export default routes;
