import React from 'react';
import { ErrorBoundary } from './components/error-boundary';
import { PortalLayout } from './components/portal-layout';
import { PortalDashboard } from './components/portal-dashboard';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <PortalLayout>
        <PortalDashboard />
      </PortalLayout>
    </ErrorBoundary>
  );
};
