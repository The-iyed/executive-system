import React from 'react';
import { useAuth } from '../context/AuthProvider';

/**
 * Identifies the current user in PostHog when authenticated.
 * No-op if PostHog is not configured (e.g. in this build).
 */
export const PostHogIdentify: React.FC = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).posthog && user?.id) {
      (window as any).posthog.identify(String(user.id), {
        email: user.email,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username,
      });
    }
  }, [user]);

  return null;
};
