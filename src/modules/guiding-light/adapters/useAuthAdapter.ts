/**
 * Auth adapter: guiding-light uses minister-mind auth.
 * Re-exports useAuth from sanad-ai with a compatible interface for guiding-light components.
 */
import { useAuth as useMinisterAuth } from '@/modules/auth';

export function useAuth() {
  const { user, isAuthenticated, logout, isLoading } = useMinisterAuth();
  return {
    user,
    isAuthenticated: !!isAuthenticated,
    isLoading: !!isLoading,
    logout,
  };
}
