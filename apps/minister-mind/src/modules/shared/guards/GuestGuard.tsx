import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@auth';
import { PATH as UC01_PATH } from '../../UC01/routes/paths';

interface GuestGuardProps {
  children: React.ReactNode;
}

const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Loading/initialization is handled centrally in AuthProvider
  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to={UC01_PATH.ROOT} replace />;
  }

  // Render children if not authenticated (guest)
  return <>{children}</>;
};

export default GuestGuard;
