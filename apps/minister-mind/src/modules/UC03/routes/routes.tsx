import { RouteProps } from 'react-router-dom';
import { Fragment, lazy } from 'react';
import { AuthGuard } from '@shared/guards';
import { PATH } from './paths';
import { Layout } from '../Layout';

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
    path: PATH.CONSULTATION_REQUESTS,
    component: lazy(() => import('../pages/consultationRequests')),
    layout: Layout,
    useCase: 'UC-03',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.CONSULTATION_REQUEST_DETAIL,
    component: lazy(() => import('../pages/consultationRequestDetail')),
    layout: Layout,
    useCase: 'UC-03',
  },
];

export default routes;

