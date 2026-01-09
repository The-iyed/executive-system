import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppMount, AppConfig } from '@sanad-ai/config';
import { createQueryClient } from '@sanad-ai/api';
import { App } from './app';
import { ErrorBoundary } from './components';

export const createMount = (): AppMount => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  return {
    mount: (el: HTMLElement, _config: AppConfig) => {
      container = el;
      root = createRoot(el);
      const queryClient = createQueryClient();
      
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </QueryClientProvider>
          </ErrorBoundary>
        </React.StrictMode>
      );
    },
    unmount: () => {
      if (root && container) {
        root.unmount();
        root = null;
        container = null;
      }
    },
  };
};
