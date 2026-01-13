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
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Check if it's the read-only property error from legal-analyst
    if (typeof message === 'string' && message.includes('Cannot assign to read only property')) {
      console.warn('[Portal] Caught read-only property assignment error (likely from external script):', {
        message,
        source,
        lineno,
        colno,
        error
      });
      // Return true to prevent default error handling, but still log it
      return true;
    }
    // Call original error handler if it exists
    if (originalErrorHandler) {
      return originalErrorHandler.call(window, message, source, lineno, colno, error);
    }
    return false;
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
      statsBotScript.crossOrigin = 'anonymous';
      
      statsBotScript.onerror = (error) => {
        console.error('[Portal] Failed to load legal-stats (AiStatsBot) script:', error);
      };
      
      statsBotScript.onload = () => {
        try {
          // Verify that AiStatsBot or StatsBot is actually exposed on window
          // The script might expose it as either name
          const statsBot = window.AiStatsBot || window.StatsBot;
          if (statsBot && typeof statsBot.open === 'function') {
            // If it's exposed as StatsBot, also expose it as AiStatsBot for consistency
            if (window.StatsBot && !window.AiStatsBot) {
              (window as any).AiStatsBot = window.StatsBot;
              console.log('[Portal] legal-stats script exposed as StatsBot, aliasing to AiStatsBot');
            }
            console.log('[Portal] legal-stats (AiStatsBot) script loaded successfully and API is available');
          } else {
            console.warn('[Portal] legal-stats script loaded but neither window.AiStatsBot nor window.StatsBot is available');
            console.warn('[Portal] Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('stats') || k.toLowerCase().includes('bot')));
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

