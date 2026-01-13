
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
  {
    exact: true,
    path: PATH.NOT_FOUND,
    component: lazy(() => import('../features/error/NotFound')),
  },
]

export default routes