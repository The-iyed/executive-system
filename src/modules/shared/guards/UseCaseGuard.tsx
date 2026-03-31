import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { hasUseCaseAccess, getDefaultRouteForUser } from '../utils/useCaseConfig';

interface UseCaseGuardProps {
  children: ReactNode;
  requiredUseCase: string;
  fallbackRoute?: string;
}

/**
 * Guard component that restricts access to routes based on user's use cases
 * Redirects to user's default route if they don't have access to the required use case
 */
export const UseCaseGuard: React.FC<UseCaseGuardProps> = ({
  children,
  requiredUseCase,
  fallbackRoute,
}) => {
  const { user, isAuthenticated, isSsoEnabled: ssoEnabled } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ssoEnabled ? '/' : '/login'} replace />;
  }

  const hasAccess = hasUseCaseAccess(user?.use_cases, requiredUseCase);

  if (!hasAccess) {
    const redirectTo = fallbackRoute || getDefaultRouteForUser(user?.use_cases, user?.roles);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default UseCaseGuard;


