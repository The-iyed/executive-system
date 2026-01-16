
import { Fragment, lazy } from 'react'
import { RouteProps } from 'react-router-dom'
import { PATH } from './path'

type RouteConfig = {
  exact: boolean | null
  path: string
  component: React.ComponentType<any>
  guard?: React.ComponentType<any> | typeof Fragment
  layout?: React.ComponentType<any> | typeof Fragment
} & RouteProps

const routes: RouteConfig[] = [
  {
    exact: true,
    path: PATH.ERROR_500,
    component: lazy(() => import('../features/error/Error500')),
  },
  {
    exact: true,
    path: PATH.ERROR_NETWORK,
    component: lazy(() => import('../features/error/ErrorNetwork')),
  },
  // Removed NotFound route - unmatched routes are now handled by redirect to user's default route
]

export default routes