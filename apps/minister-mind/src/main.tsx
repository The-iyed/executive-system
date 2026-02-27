import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@sanad-ai/api';
import { ErrorBoundary } from '@shared';
import { AuthProvider } from '@auth';
import { App } from './app';
import './styles.css';
import * as Sentry from "@sentry/react";

const SENTRY_DSN = "https://613ed30c125b3224b530b446c0a9a354@o4510955172724736.ingest.us.sentry.io/4510955197693952";

  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: true
  });

const queryClient = createQueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  </ErrorBoundary>
);
