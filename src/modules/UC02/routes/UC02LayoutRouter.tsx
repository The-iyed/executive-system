import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { prefetchUC02Routes } from './prefetchRoutes';
import { useAuth } from '@/modules/auth';
import { AuthGuard } from '@/modules/shared/guards';
import { ScreenLoader, Loader } from '@/modules/shared';
import { filterRoutesByUseCase } from '@/modules/shared/utils/routeFilter';
import { getDefaultRouteForUser } from '@/modules/shared/utils/useCaseConfig';
import { Layout } from '../Layout';
import uc02Routes from './routes';

/** Inline fallback for lazy route chunks: keeps layout visible, only content area shows loading */
const ContentAreaFallback = () => (
  <div className="flex-1 flex min-h-[320px] w-full">
    <Loader />
  </div>
);

/**
 * Renders UC-02 Layout once with an inner Routes so that when navigating
 * between /directives, /calendar, /work-basket, etc., only the outlet
 * content changes and the layout (header, nav) persists.
 */
export const UC02LayoutRouter: React.FC = () => {
  const { user, isInitialised } = useAuth();
  const filtered = filterRoutesByUseCase(uc02Routes, user?.use_cases, user?.roles);
  const defaultRoute = getDefaultRouteForUser(user?.use_cases, user?.roles);

  useEffect(() => {
    prefetchUC02Routes();
  }, []);

  if (!isInitialised) {
    return <ScreenLoader />;
  }

  return (
    <AuthGuard>
      <Layout>
        <Suspense fallback={<ContentAreaFallback />}>
          <Routes>
            {filtered.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<route.component />}
              />
            ))}
            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </AuthGuard>
  );
};
