
import {RouteProps } from 'react-router-dom'
import { Fragment, lazy } from 'react'
import { PATH } from './paths'

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
    // guard: GuestGuard,
    path: PATH.RECENT_ACTIVITY,
    component: lazy(() => import('../pages/recentActivity')),
    // layout: GuestLayout,
  },
]

export default routes