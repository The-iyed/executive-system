/**
 * Auth adapter: guiding-light uses minister-mind auth.
 * Re-exports useAuth from sanad-ai with a compatible interface for guiding-light components.
 */
import { useAuth as useMinisterAuth } from '@/modules/auth';

export function useAuth() {
  const auth = useMinisterAuth();
  return {
    user: auth.user,
    isAuthenticated: !!auth.isAuthenticated,
    isLoading: !!(auth as any).isLoading,
    login: (auth as any).login as ((...args: any[]) => Promise<any>) | undefined,
    logout: auth.logout,
  };
}
