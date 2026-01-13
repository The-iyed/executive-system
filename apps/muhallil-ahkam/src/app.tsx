import React, { useEffect } from 'react';
import { Toaster } from '@sanad-ai/ui';
import { useLocation, useNavigate } from 'react-router-dom';
import routes, { renderRoutes } from './routes'
import { PATH } from './routes/path';

// Component to ensure we're on a valid route
const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If we're on an unknown path, redirect to root (only once)
    const validPaths = [PATH.ROOT, PATH.CASES, PATH.DOCS];
    const isCaseFilesPath = location.pathname.startsWith('/cases/') && location.pathname.includes('/files');
    const isValidPath = validPaths.includes(location.pathname) || isCaseFilesPath;
    
    if (!isValidPath && location.pathname !== PATH.ROOT) {
      console.log('[Muhallil Ahkam] Invalid path, redirecting to root:', location.pathname);
      navigate(PATH.ROOT, { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <>
      <RouteGuard>
        {renderRoutes(routes)}
      </RouteGuard>
      <Toaster />
    </>
  );
};