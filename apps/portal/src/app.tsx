import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/error-boundary';
import { PortalLayout } from './components/portal-layout';
import { PortalDashboard } from './components/portal-dashboard';
import { DocsPage } from './components/docs-page';
// Import types to ensure Window interface is extended
import '@sanad-ai/config';

const AppContent: React.FC = () => {
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const handleOpenApp = (appName: string) => {
    setActiveApp(appName);
  };

  // Mount app when activeApp changes
  useEffect(() => {
    if (!activeApp) return;

    // For legal-stats, AiStatsBot manages its own modal, so we don't need a container
    if (activeApp === 'legal-stats') {
      // Helper to get the stats bot API (check all possible names)
      const getStatsBot = () => {
        return window.legalStats || window.AiStatsBot || window.StatsBot;
      };

      const mountAiStatsBot = () => {
        const statsBot = getStatsBot();
        if (statsBot && typeof statsBot.open === 'function') {
          try {
            statsBot.open();
          } catch (error) {
            console.error('[Portal] Error calling stats bot open():', error);
          }
        } else {
          console.error('[Portal] Stats bot is not available or missing open method');
          console.error('[Portal] window.AiStatsBot:', window.AiStatsBot);
          console.error('[Portal] window.StatsBot:', window.StatsBot);
        }
      };

      // Check if stats bot is available
      const statsBot = getStatsBot();
      if (statsBot && typeof statsBot.open === 'function') {
        mountAiStatsBot();
      } else {
        // Wait for script to load
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds at 50ms intervals
        const checkInterval = setInterval(() => {
          attempts++;
          const bot = getStatsBot();
          if (bot && typeof bot.open === 'function') {
            clearInterval(checkInterval);
            mountAiStatsBot();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('[Portal] Stats bot failed to load after 5 seconds. Make sure the script is loaded correctly.');
            console.error('[Portal] window.legalStats:', window.legalStats);
            console.error('[Portal] window.AiStatsBot:', window.AiStatsBot);
            console.error('[Portal] window.StatsBot:', window.StatsBot);
          }
        }, 50);
      }

      // Cleanup on unmount
      return () => {
        const statsBot = getStatsBot();
        if (statsBot && typeof statsBot.close === 'function') {
          try {
            statsBot.close();
          } catch (error) {
            console.error('[Portal] Error calling stats bot close():', error);
          }
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

    // For sanad-ai and muhallil-ahkam, they manage their own isolated containers
    if (activeApp === 'sanad-ai' || activeApp === 'muhallil-ahkam') {
      const mountApp = () => {
        if (activeApp === 'sanad-ai' && window.SanadAiV3) {
          // Package manages its own isolated container
          window.SanadAiV3.open();
        } else if (activeApp === 'muhallil-ahkam' && window.MuhallilAhkam) {
          // Package manages its own isolated container
          window.MuhallilAhkam.open();
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
    }
    // Return undefined for other code paths
    return undefined;
  }, [activeApp]);

  // All apps (sanad-ai, muhallil-ahkam, legal-stats, legal-assistant) now manage their own isolated modals
  // So we just show the dashboard - the modals will be opened by their respective .open() calls

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
