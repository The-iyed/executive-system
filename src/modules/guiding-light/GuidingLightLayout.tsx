/**
 * Guiding-light layout: wraps AppLayout for minister users.
 * Uses minister-mind auth (no separate guiding-light auth).
 * VITE_BASE_URL APIs use x-api-key; VITE_APP_BASE_URL_MINISTER APIs use Bearer token.
 */
import './guiding-light-styles.css';
import { AppLayout } from './layouts/AppLayout';
import { AppProviders } from './providers/AppProviders';

export function GuidingLightLayout() {
  return (
    <div className="guiding-light h-svh w-full">
      <AppProviders>
        <AppLayout />
      </AppProviders>
    </div>
  );
}
