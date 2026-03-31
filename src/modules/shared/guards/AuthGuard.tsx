import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, PATH } from '@/modules/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isSsoEnabled: ssoEnabled } = useAuth();
  const location = useLocation();

  // Loading/initialization is handled centrally in AuthProvider
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (ssoEnabled) {
      return <Navigate to="/" replace />;
    }
    const attempted = `${location.pathname}${location.search ?? ''}`;
    if (attempted === PATH.LOGIN || attempted.startsWith(`${PATH.LOGIN}?`)) {
      return <Navigate to={PATH.LOGIN} replace />;
    }
    return (
      <Navigate
        to={`${PATH.LOGIN}?redirect=${encodeURIComponent(attempted)}`}
        replace
      />
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default AuthGuard;