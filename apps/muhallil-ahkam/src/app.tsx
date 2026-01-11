import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@sanad-ai/api';
import { Toaster } from '@sanad-ai/ui';
import routes, { renderRoutes } from './routes'

export const App: React.FC = () => {
  const queryClient = createQueryClient();

  return (
     <QueryClientProvider client={queryClient}>
       {renderRoutes(routes)}
       <Toaster />
     </QueryClientProvider>
  );
};