import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactQuery from '@tanstack/react-query';
import { App } from './app';
// Import styles
import './styles.css';

// Expose React, ReactDOM, and ReactQuery as globals for UMD bundles
// This must happen BEFORE the UMD bundles load
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  (window as any).ReactQuery = ReactQuery;
  
  // Add global error handler to catch read-only property errors from external scripts
  // This is a known issue with legal-analyst.umd.js trying to assign to read-only properties
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Check if it's the read-only property error from legal-analyst
    if (typeof message === 'string' && message.includes('Cannot assign to read only property')) {
      // This is a known issue with the external legal-analyst script
      // It tries to assign to a read-only 'error' property, which fails
      // The script still works despite this error, so we suppress it
      console.warn('[Portal] Suppressed read-only property error from external script (legal-analyst.umd.js)', {
        message,
        source: source || 'unknown',
        line: lineno,
        column: colno
      });
      // Return true to prevent default error handling (red error in console)
      return true;
    }
    // Call original error handler if it exists
    if (originalErrorHandler) {
      return originalErrorHandler.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  // Also catch unhandled promise rejections that might be related
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    // Check if it's a read-only property error
    const reason = event.reason;
    if (reason && typeof reason === 'object' && reason.message) {
      if (typeof reason.message === 'string' && reason.message.includes('Cannot assign to read only property')) {
        console.warn('[Portal] Suppressed unhandled promise rejection (read-only property error from external script)');
        event.preventDefault(); // Prevent the error from showing in console
        return;
      }
    }
    // Call original handler if it exists
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event);
    }
  };
  
  // Load UMD bundles after React globals are exposed
  const portalBaseUrl = import.meta.env.VITE_PORTAL_BASE_URL || window.location.origin;
  
  // Load Sanad AI bundle
  const sanadScript = document.createElement('script');
  sanadScript.src = `${portalBaseUrl}/sanad-ai-v3.js`;
  document.head.appendChild(sanadScript);
  
  // Load Muhallil Ahkam bundle
  const ahkamScript = document.createElement('script');
  ahkamScript.src = `${portalBaseUrl}/muhallil-ahkam.js`;
  document.head.appendChild(ahkamScript);
  
  // Load Legal Stats Bot (محلل الرؤى والتوقعات) from external URL
  document.addEventListener('DOMContentLoaded', function () {
    try {
      const statsBotScript = document.createElement('script');
      statsBotScript.src = 'https://legal-stats.momrahai.com/legal-analyst.umd.js';
      statsBotScript.async = true;
      // Note: crossOrigin is NOT set - script tags don't need CORS headers unless you're reading their content
      // Removing crossOrigin prevents CORS errors while still allowing the script to execute
      
      statsBotScript.onerror = (error) => {
        console.error('[Portal] Failed to load legal-stats (AiStatsBot) script:', error);
      };
      
      statsBotScript.onload = () => {
        try {
          // Verify that the API is actually exposed on window
          // The script might expose it as legalStats, StatsBot, or AiStatsBot
          const statsBot = window.legalStats || window.AiStatsBot || window.StatsBot;
          if (statsBot && typeof statsBot.open === 'function') {
            // Alias to AiStatsBot for consistency across the codebase
            if (!window.AiStatsBot) {
              (window as any).AiStatsBot = statsBot;
              if (window.legalStats) {
                console.log('[Portal] legal-stats script exposed as legalStats, aliasing to AiStatsBot');
              } else if (window.StatsBot) {
                console.log('[Portal] legal-stats script exposed as StatsBot, aliasing to AiStatsBot');
              }
            }
            console.log('[Portal] legal-stats (AiStatsBot) script loaded successfully and API is available');
          } else {
            console.warn('[Portal] legal-stats script loaded but API is not available');
            console.warn('[Portal] window.legalStats:', window.legalStats);
            console.warn('[Portal] window.AiStatsBot:', window.AiStatsBot);
            console.warn('[Portal] window.StatsBot:', window.StatsBot);
            console.warn('[Portal] Available window properties:', Object.keys(window).filter(k => 
              k.toLowerCase().includes('stats') || 
              k.toLowerCase().includes('bot') || 
              k.toLowerCase().includes('legal')
            ));
          }
        } catch (error) {
          console.error('[Portal] Error during legal-stats script execution:', error);
        }
      };
      
      document.body.appendChild(statsBotScript);
    } catch (error) {
      console.error('[Portal] Error setting up legal-stats script:', error);
    }
    
    // Load Legal Assistant (المذكرة القانونية) from external URL
    try {
      const legalAssistantScript = document.createElement('script');
      legalAssistantScript.src = 'https://legal-assistant-v2.momrahai.com/legal-assistant-v1.1.umd.js';
      legalAssistantScript.async = true;
      legalAssistantScript.crossOrigin = 'anonymous';
      
      legalAssistantScript.onerror = (error) => {
        console.error('[Portal] Failed to load legal-assistant script:', error);
      };
      
      legalAssistantScript.onload = () => {
        try {
          console.log('[Portal] legal-assistant script loaded successfully');
        } catch (error) {
          console.error('[Portal] Error during legal-assistant script execution:', error);
        }
      };
      
      document.body.appendChild(legalAssistantScript);
    } catch (error) {
      console.error('[Portal] Error setting up legal-assistant script:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

