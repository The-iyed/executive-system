/**
 * Guard: redirects non-MINISTER users away from guiding-light to their default route.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { getDefaultRouteForUser, isMinisterUser } from '@/modules/shared/utils/useCaseConfig';

interface MinisterGuardProps {
  children: React.ReactNode;
}

export function MinisterGuard({ children }: MinisterGuardProps) {
  const { user } = useAuth();
  if (!isMinisterUser(user?.roles)) {
    const defaultRoute = getDefaultRouteForUser(user?.use_cases, user?.roles);
    return <Navigate to={defaultRoute} replace />;
  }
  return <>{children}</>;
}
