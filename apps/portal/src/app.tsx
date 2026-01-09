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
      <PortalLayout>
        {appMetadata ? (
          <div className="w-full h-full">
            <button
              onClick={handleBackToDashboard}
              className="mb-6 px-4 py-2 bg-[#045859] text-white rounded-lg hover:bg-[#06494A] transition-colors flex items-center gap-2"
              dir="rtl"
              style={{ fontFamily: 'Frutiger LT Arabic, sans-serif' }}
            >
              <span>←</span>
              <span>العودة إلى الخدمات</span>
            </button>
            <AppLoader app={appMetadata} />
          </div>
        ) : (
          <PortalDashboard onOpenApp={handleOpenApp} />
        )}
      </PortalLayout>
    </ErrorBoundary>
  );
};
