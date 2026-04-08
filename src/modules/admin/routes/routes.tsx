import { Fragment, lazy } from 'react';
import { RouteProps } from 'react-router-dom';
import { PATH } from './paths';
import { SharedLayout } from '@/modules/shared';
import { AuthGuard } from '@/modules/shared/guards';

type RouteConfig = {
  exact: boolean | null
  path: string
  component: React.ComponentType<any>
  guard?: React.ComponentType<any> | typeof Fragment | any
  layout?: React.ComponentType<any> | typeof Fragment
} & RouteProps

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.NOTIFICATIONS,
    component: lazy(() => import('../features/Notifications')),
    layout: SharedLayout,
  },
  
]

export default routes