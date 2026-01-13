import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppMount } from '@sanad-ai/config';
import { createQueryClient } from '@sanad-ai/api';
import { App } from './app';
import { ErrorBoundary } from './components';

export const createMount = (): AppMount => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  return {
    mount: (el: HTMLElement) => {
      container = el;
      root = createRoot(el);
      const queryClient = createQueryClient();
      
      // Use MemoryRouter with initial location "/" to ensure routes always match
      // This prevents issues when the package is loaded in another platform
      // where the BrowserRouter might use the host's URL
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <App />
              </MemoryRouter>
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
