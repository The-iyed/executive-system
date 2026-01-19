
import {RouteProps } from 'react-router-dom'
import { Fragment, lazy } from 'react'
import { PATH } from './paths'
import { Layout } from '../Layout'
import { AuthGuard } from '@shared/guards'

type RouteConfig = {
  exact: boolean | null
  path: string
  component: React.ComponentType<any>
  guard?: React.ComponentType<any> | typeof Fragment | any
  layout?: React.ComponentType<any> | typeof Fragment
  useCase?: string
} & RouteProps

const routes: RouteConfig[] = [
  {
    exact: true,
    // guard: GuestGuard,
    path: PATH.RECENT_ACTIVITY,
    component: lazy(() => import('../pages/recentActivity')),
    layout: Layout,
    useCase: 'UC-02',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.SCHEDULE_REVIEW,
    component: lazy(() => import('../pages/scheduleReview')),
    layout: Layout,
    useCase: 'UC-02',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.MEETING_DETAIL,
    component: lazy(() => import('../pages/meetingDetail')),
    layout: Layout,
    useCase: 'UC-02',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.DIRECTIVES,
    component: lazy(() => import('../pages/directives')),
    layout: Layout,
    useCase: 'UC-02',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.SCHEDULED_MEETINGS,
    component: lazy(() => import('../pages/scheduledMeetings')),
    layout: Layout,
    useCase: 'UC-02',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.WORK_BASKET,
    component: lazy(() => import('../pages/workBasket')),
    layout: Layout,
    useCase: 'UC-02',
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.CALENDAR,
    component: lazy(() => import('../pages/calendar')),
    layout: Layout,
    useCase: 'UC-02',
  },
]

export default routes