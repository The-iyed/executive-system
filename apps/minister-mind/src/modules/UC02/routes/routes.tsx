
import {RouteProps } from 'react-router-dom'
import { Fragment, lazy } from 'react'
import { AuthGuard } from '@shared/guards'
import { Layout } from '../Layout'
import { PATH } from './paths'

type RouteConfig = {
  exact: boolean | null
  path: string
  component: React.ComponentType<any>
  guard?: React.ComponentType<any> | typeof Fragment | any
  layout?: React.ComponentType<any> | typeof Fragment
  useCase?: string
  useCases?: string[]
} & RouteProps

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.MEETING_DETAIL,
    component: lazy(() => import('../pages/meetingDetail')),
    layout: Layout,
    // Allow access to meeting details for both UC-01 and UC-02 users
    useCases: ['UC-01', 'UC-02'],
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
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.WAITING_LIST,
    component: lazy(() => import('../pages/waitingList')),
    layout: Layout,
    useCase: 'UC-02',
  },
]

export default routes