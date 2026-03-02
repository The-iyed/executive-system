import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api';
import { ErrorBoundary } from '@/modules/shared';
import { AuthProvider } from '@/modules/auth';
import { App } from './app';
import './styles.css';
import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react';

const SENTRY_DSN = "https://613ed30c125b3224b530b446c0a9a354@o4510955172724736.ingest.us.sentry.io/4510955197693952";

if (false) { // Sentry disabled in non-production
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: "development",
    sendDefaultPii: true,
  });
}

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost.replace(/\/$/, ''),
  });
}

const queryClient = createQueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <PostHogProvider client={posthog}>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </PostHogProvider>
      </QueryClientProvider>
    </React.StrictMode>
  </ErrorBoundary>
);
