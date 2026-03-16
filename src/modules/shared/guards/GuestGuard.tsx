import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { getDefaultRouteForUser } from '../utils/useCaseConfig';

interface GuestGuardProps {
  children: React.ReactNode;
}

const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Loading/initialization is handled centrally in AuthProvider
  // Redirect to user's default route if already authenticated
  if (isAuthenticated) {
    const defaultRoute = getDefaultRouteForUser(user?.use_cases, user?.roles);
    return <Navigate to={defaultRoute} replace />;
  }

  // Render children if not authenticated (guest)
  return <>{children}</>;
};

export default GuestGuard;
