import { useEffect } from 'react';
import { usePostHog } from '@posthog/react';
import { useAuth } from '../context/AuthProvider';

/**
 * Identifies the authenticated user in PostHog with roles and use_cases from /api/auth/me.
 * Renders nothing; mount inside AuthProvider.
 */
export function PostHogIdentify() {
  const posthog = usePostHog();
  const { user } = useAuth();

  useEffect(() => {
    if (!posthog || !user) return;

    const roles = user.roles?.map((r) => r.code) ?? [];
    posthog.identify(user.id, {
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      roles,
      use_cases: user.use_cases ?? [],
    });
  }, [posthog, user]);

  return null;
}
