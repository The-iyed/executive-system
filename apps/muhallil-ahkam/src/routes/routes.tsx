
import { RouteProps } from 'react-router-dom'
import { Fragment, lazy } from 'react'
import { AppLayout } from '../components'
import { PATH } from './path'

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
      // guard: AuthGuard,
      path: PATH.ROOT,
      component: lazy(() => import('../pages/chat')),
      layout: AppLayout,
    },
    {
      exact: true,
      // guard: AuthGuard,
      path: PATH.CASES,
      component: lazy(() => import('../pages/cases')),
      layout: AppLayout,
    },
    {
      exact: true,
      // guard: AuthGuard,
      path: PATH.CASE_FILES,
      component: lazy(() => import('../pages/caseFiles')),
      layout: AppLayout,
    },
]

export default routes