import React from 'react';
import { Toaster } from '@sanad-ai/ui';
import routes, { renderRoutes } from '../modules/shared/routes';

export const App: React.FC = () => {
  return (
    <>
        {renderRoutes(routes)}
        <Toaster />
    </>
  );
};
