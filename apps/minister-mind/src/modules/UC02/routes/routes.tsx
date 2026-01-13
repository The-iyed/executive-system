
import {RouteProps } from 'react-router-dom'
import { Fragment, lazy } from 'react'
import { PATH } from './paths'
import { Layout } from '../Layout'

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
    layout: Layout,
  },
  {
    exact: true,
    // guard: GuestGuard,
    path: PATH.SCHEDULE_REVIEW,
    component: lazy(() => import('../pages/scheduleReview')),
    layout: Layout,
  },
]

export default routes