import posthog from 'posthog-js';
import { usePostHog } from '@posthog/react';
import { useCallback } from 'react';

/**
 * Track an event with use_case for filtering in PostHog.
 * Use this from React components via useAnalytics, or call directly from non-React code.
 */
export function trackEvent(
  useCase: string,
  eventName: string,
  properties?: Record<string, unknown>
): void {
  posthog?.capture(eventName, {
    use_case: useCase,
    ...properties,
  });
}

/**
 * Hook for tracking events from React components.
 * Uses usePostHog for proper initialization handling.
 */
export function useAnalytics() {
  const posthog = usePostHog();

  const trackEvent = useCallback(
    (useCase: string, eventName: string, properties?: Record<string, unknown>) => {
      posthog?.capture(eventName, {
        use_case: useCase,
        ...properties,
      });
    },
    [posthog]
  );

  return { trackEvent };
}
