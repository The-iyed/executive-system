import { RouteProps } from 'react-router-dom';
import { Fragment, lazy } from 'react';
import { PATH } from './paths';
import { Layout } from '../Layout';
import { AuthGuard } from '@shared';

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
    path: PATH.MEETINGS,
    component: lazy(() => import('../features/Meeting')),
    layout: Layout,
    useCase: 'UC-08',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.MEETING_PREVIEW,
    component: lazy(() => import('../features/PreviewMeeting')),
    layout: Layout,
    useCase: 'UC-08',
  },
];

export default routes;
