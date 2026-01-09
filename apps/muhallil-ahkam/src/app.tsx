import React from 'react';
import routes, { renderRoutes } from './routes'

export const App: React.FC = () => {
  return (
    <>
     {renderRoutes(routes)}
    </>
  );
};