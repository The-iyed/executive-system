
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
    path: PATH.HOME,
    component: lazy(() => import('../features/Home')),
    layout: Layout,
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.MEETINGS,
    component: lazy(() => import('../features/Meeting')),
    layout: Layout,
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.NEW_MEETING,
    component: lazy(() => import('../features/NewMeeting')),
    layout: Layout,
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.MEETING_PREVIEW,
    component: lazy(() => import('../features/PreviewMeeting')),
    layout: Layout,
  },
]

export default routes