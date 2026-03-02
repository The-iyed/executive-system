/**
 * Analytics / event tracking stub.
 * Implement with PostHog or your analytics provider when configured.
 */
export function trackEvent(
  _category: string,
  _action: string,
  _properties?: Record<string, unknown>
): void {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(_action, { category: _category, ..._properties });
  }
}
