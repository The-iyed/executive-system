import { RouteProps } from 'react-router-dom';
import { Fragment, lazy } from 'react';
import { PATH } from './paths';
import { Layout } from '../Layout';
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
    path: PATH.CONTENT_REQUESTS,
    component: lazy(() => import('../pages/contentRequests')),
    layout: Layout,
    useCase: 'UC-05',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.CONTENT_REQUEST_DETAIL,
    component: lazy(() => import('../pages/contentRequestDetail')),
    layout: Layout,
    useCase: 'UC-05',
  },
];

export default routes;

