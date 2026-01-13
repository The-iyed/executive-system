
import { Fragment, Suspense } from 'react'
import { Routes, Route, RouteProps, Navigate } from 'react-router-dom'

import pages from './routes'
import { PATH } from './path'


type RouteConfig = {
  exact: boolean | null
  path: string
  component: React.ComponentType<any>
  guard?: React.ComponentType<any> | typeof Fragment
  layout?: React.ComponentType<any> | typeof Fragment
} & RouteProps

// Simple loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-[#045859]/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-[#045859] border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-[#045859] font-medium" dir="rtl">جارٍ التحميل...</p>
    </div>
  </div>
)

export const renderRoutes = (routes: RouteConfig[] = []) => {
  // Log routes for debugging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[Muhallil Ahkam] Rendering routes:', routes.map(r => r.path));
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {routes.map((route, index) => {
          const Component = route.component
          const Guard = route?.guard || Fragment
          const Layout = route?.layout || Fragment

          return (
            <Route
              key={index}
              path={route.path}
              element={
                <Guard>
                  <Layout>
                    <Component />
                  </Layout>
                </Guard>
              }
            />
          )
        })}
        {/* Catch-all route: redirect unknown paths to root */}
        <Route path="*" element={<Navigate to={PATH.ROOT} replace />} />
      </Routes>
    </Suspense>
  );
}

const routes: RouteConfig[] = [...pages]

export default routes