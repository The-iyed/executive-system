import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, PATH } from '@auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Loading/initialization is handled centrally in AuthProvider
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={PATH.LOGIN} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default AuthGuard;