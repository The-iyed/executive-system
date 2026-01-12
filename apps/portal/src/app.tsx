import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/error-boundary';
import { PortalLayout } from './components/portal-layout';
import { PortalDashboard } from './components/portal-dashboard';
import { DocsPage } from './components/docs-page';
// Import types to ensure Window interface is extended
import '@sanad-ai/config';

const AppContent: React.FC = () => {
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const navigate = useNavigate();
  const appContainerRef = useRef<HTMLDivElement>(null);

  const handleOpenApp = (appName: string) => {
    setActiveApp(appName);
  };

  const handleBackToDashboard = () => {
    // Close any open app
    if (window.SanadAiV3 && window.SanadAiV3.isOpen()) {
      window.SanadAiV3.close();
    }
    if (window.MuhallilAhkam && window.MuhallilAhkam.isOpen()) {
      window.MuhallilAhkam.close();
    }
    if (window.AiStatsBot) {
      window.AiStatsBot.close();
    }
    if (window.LegalAssistant) {
      window.LegalAssistant.close();
    }
    
    setActiveApp(null);
    navigate('/');
  };

  // Mount app when activeApp changes
  useEffect(() => {
    if (!activeApp) return;

    // For legal-stats, AiStatsBot manages its own modal, so we don't need a container
    if (activeApp === 'legal-stats') {
      const mountAiStatsBot = () => {
        if (window.AiStatsBot) {
          window.AiStatsBot.open();
        }
      };

      // Check if AiStatsBot is available
      if (window.AiStatsBot) {
        mountAiStatsBot();
      } else {
        // Wait for script to load
        const checkInterval = setInterval(() => {
          if (window.AiStatsBot) {
            clearInterval(checkInterval);
            mountAiStatsBot();
          }
        }, 50);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 5000);
      }

      // Cleanup on unmount
      return () => {
        if (window.AiStatsBot) {
          window.AiStatsBot.close();
        }
      };
    }

    // For legal-assistant, LegalAssistant manages its own modal, so we don't need a container
    if (activeApp === 'legal-assistant') {
      const mountLegalAssistant = () => {
        if (window.LegalAssistant) {
          window.LegalAssistant.open();
        }
      };

      // Check if LegalAssistant is available
      if (window.LegalAssistant) {
        mountLegalAssistant();
      } else {
        // Wait for script to load
        const checkInterval = setInterval(() => {
          if (window.LegalAssistant) {
            clearInterval(checkInterval);
            mountLegalAssistant();
          }
        }, 50);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 5000);
      }

      // Cleanup on unmount
      return () => {
        if (window.LegalAssistant) {
          window.LegalAssistant.close();
        }
      };
    }

    // For other apps, we need a container
    if (!appContainerRef.current) return;

    const container = appContainerRef.current;

    // Wait for scripts to load if needed
    const mountApp = () => {
      if (activeApp === 'sanad-ai' && window.SanadAiV3) {
        window.SanadAiV3.open(container);
      } else if (activeApp === 'muhallil-ahkam' && window.MuhallilAhkam) {
        window.MuhallilAhkam.open(container);
      }
    };

    // Check if window APIs are available
    if (
      (activeApp === 'sanad-ai' && window.SanadAiV3) ||
      (activeApp === 'muhallil-ahkam' && window.MuhallilAhkam)
    ) {
      mountApp();
    } else {
      // Wait for scripts to load
      const checkInterval = setInterval(() => {
        if (
          (activeApp === 'sanad-ai' && window.SanadAiV3) ||
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
      if (activeApp === 'sanad-ai' && window.SanadAiV3 && window.SanadAiV3.isOpen()) {
        window.SanadAiV3.close();
      } else if (activeApp === 'muhallil-ahkam' && window.MuhallilAhkam && window.MuhallilAhkam.isOpen()) {
        window.MuhallilAhkam.close();
      }
    };
  }, [activeApp]);

  // If an app is active, show it
  // Note: legal-stats (AiStatsBot) and legal-assistant (LegalAssistant) manage their own modals
  if (activeApp && activeApp !== 'legal-stats' && activeApp !== 'legal-assistant') {
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
  
  // For legal-stats, AiStatsBot manages its own modal, so we just show the dashboard
  // The modal will be opened by AiStatsBot.open() call

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
