import React, { useState } from 'react';
import { ErrorBoundary } from './components/error-boundary';
import { PortalLayout } from './components/portal-layout';
import { PortalDashboard } from './components/portal-dashboard';
import { AppLoader } from './components/app-loader';
import { getAppMetadata } from '@sanad-ai/config';

export const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const handleOpenApp = (appName: string) => {
    setActiveApp(appName);
  };

  const handleBackToDashboard = () => {
    setActiveApp(null);
  };

  const appMetadata = activeApp ? getAppMetadata(activeApp) : null;

  return (
    <ErrorBoundary>
      {appMetadata ? (
        <div
          className="fixed inset-0 bg-background flex flex-col"
          dir="rtl"
          style={{ fontFamily: 'Frutiger LT Arabic, sans-serif' }}
        >
          <main className="flex-1 overflow-hidden bg-background relative" style={{ height: '100%', width: '100%' }}>
            <div className="w-full h-full" style={{ height: '100%', width: '100%', position: 'relative' }}>
              <AppLoader app={appMetadata} />
            </div>
            {/* Floating close button in bottom right */}
            <button
              onClick={handleBackToDashboard}
              aria-label="إغلاق التطبيق"
              className="fixed bottom-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 text-2xl leading-none hover:scale-110 active:scale-95"
              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
            >
              ×
            </button>
          </main>
        </div>
      ) : (
        <PortalLayout>
          <PortalDashboard onOpenApp={handleOpenApp} />
        </PortalLayout>
      )}
    </ErrorBoundary>
  );
};
