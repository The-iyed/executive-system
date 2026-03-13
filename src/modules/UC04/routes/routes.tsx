import { RouteProps } from 'react-router-dom';
import { Fragment, lazy } from 'react';
import { PATH } from './paths';
import { Layout } from '../Layout';
import { AuthGuard } from '@/modules/shared/guards';

type RouteConfig = {
  exact: boolean | null;
  path: string;
  component: React.ComponentType<any>;
  guard?: React.ComponentType<any> | typeof Fragment | any;
  layout?: React.ComponentType<any> | typeof Fragment;
  useCase?: string;
  excludeRoleCodes?: string[];
} & RouteProps;

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.GUIDANCE_REQUESTS,
    component: lazy(() => import('../pages/guidanceRequests')),
    layout: Layout,
    useCase: 'UC-04',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.GUIDANCE_REQUEST_DETAIL,
    component: lazy(() => import('../pages/guidanceRequestDetail')),
    layout: Layout,
    useCase: 'UC-04',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.EXCEPTION_REQUEST,
    component: lazy(() => import('../pages/exceptionRequest')),
    layout: Layout,
    useCase: 'UC-04',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.EXCEPTION_REQUEST_DETAIL,
    component: lazy(() => import('../pages/guidanceRequestDetail')),
    layout: Layout,
    useCase: 'UC-04',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.EVALUATION,
    component: lazy(() => import('../pages/evaluation')),
    layout: Layout,
    useCase: 'UC-04',
    excludeRoleCodes: ['EXECUTIVE_OFFICE_MANAGER'],
  },
];

export default routes;

