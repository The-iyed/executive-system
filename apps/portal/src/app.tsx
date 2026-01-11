import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/error-boundary';
import { PortalLayout } from './components/portal-layout';
import { PortalDashboard } from './components/portal-dashboard';
import { DocsPage } from './components/docs-page';
import { AppConfig } from '@sanad-ai/config';
// Import types to ensure Window interface is extended
import '@sanad-ai/config';

const AppContent: React.FC = () => {
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const navigate = useNavigate();
  const appContainerRef = useRef<HTMLDivElement>(null);

  // Get config from environment variables
  const getAppConfig = (): AppConfig => {
    const apiBaseUrl =import.meta.env.VITE_API_BASE_URL ;
    const username = import.meta.env.VITE_API_BASIC_AUTH_USERNAME;
    const password = import.meta.env.VITE_API_BASIC_AUTH_PASSWORD;
    const authString = import.meta.env.VITE_API_BASIC_AUTH;

    const basicAuth = authString 
      ? { authString }
      : (username && password ? { username, password } : undefined);

    return {
      apiBaseUrl,
      basicAuth,
    };
  };

  const handleOpenApp = (appName: string) => {
    setActiveApp(appName);
  };

  const handleBackToDashboard = () => {
    // Close any open app
    if (window.SanadAi && window.SanadAi.isOpen()) {
      window.SanadAi.close();
    }
    if (window.MuhallilAhkam && window.MuhallilAhkam.isOpen()) {
      window.MuhallilAhkam.close();
    }
    
    setActiveApp(null);
    navigate('/');
  };

  // Mount app when activeApp changes
  useEffect(() => {
    if (!activeApp || !appContainerRef.current) return;

    const container = appContainerRef.current;
    const config = getAppConfig();

    // Wait for scripts to load if needed
    const mountApp = () => {
      if (activeApp === 'sanad-ai' && window.SanadAi) {
        window.SanadAi.open(container, config);
      } else if (activeApp === 'muhallil-ahkam' && window.MuhallilAhkam) {
        window.MuhallilAhkam.open(container, config);
      }
    };

    // Check if window APIs are available
    if (
      (activeApp === 'sanad-ai' && window.SanadAi) ||
      (activeApp === 'muhallil-ahkam' && window.MuhallilAhkam)
    ) {
      mountApp();
    } else {
      // Wait for scripts to load
      const checkInterval = setInterval(() => {
        if (
          (activeApp === 'sanad-ai' && window.SanadAi) ||
          (activeApp === 'muhallil-ahkam' && window.MuhallilAhkam)
        ) {
          clearInterval(checkInterval);
          mountApp();
        }
      }, 50);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 5000);
    }

    // Cleanup on unmount
    return () => {
      if (activeApp === 'sanad-ai' && window.SanadAi && window.SanadAi.isOpen()) {
        window.SanadAi.close();
      } else if (activeApp === 'muhallil-ahkam' && window.MuhallilAhkam && window.MuhallilAhkam.isOpen()) {
        window.MuhallilAhkam.close();
      }
    };
  }, [activeApp]);

  // If an app is active, show it
  if (activeApp) {
    return (
      <div
        className="fixed inset-0 bg-background flex flex-col"
        dir="rtl"
        style={{ fontFamily: 'Frutiger LT Arabic, sans-serif' }}
      >
        <main className="flex-1 overflow-hidden bg-background relative" style={{ height: '100%', width: '100%' }}>
          <div ref={appContainerRef} className="w-full h-full" style={{ height: '100%', width: '100%', position: 'relative' }} />
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
    );
  }

  // Otherwise show routes
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PortalLayout>
            <PortalDashboard onOpenApp={handleOpenApp} />
          </PortalLayout>
        }
      />
      <Route
        path="/docs"
        element={
          <PortalLayout>
            <DocsPage />
          </PortalLayout>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
};
