import { RouteProps } from 'react-router-dom';
import { Fragment, lazy } from 'react';
import { AuthGuard } from '@/modules/shared/guards';
import { Layout } from '../Layout';
import { PATH } from './paths';

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
    path: PATH.DIRECTIVES,
    component: lazy(() => import('../pages/DirectivesListPage')),
    layout: Layout,
    useCase: 'UC-19',
  },
];

export default routes;
