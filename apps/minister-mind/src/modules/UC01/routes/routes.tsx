
import {RouteProps } from 'react-router-dom'
import { Fragment, lazy } from 'react'
import { PATH } from './paths'
import { Layout } from '../Layout'
import { AuthGuard } from '@shared'

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
    path: PATH.RECENT_ACTIVITY,
    component: lazy(() => import('../features/RecentActivity')),
    layout: Layout,
  },
  
]

export default routes