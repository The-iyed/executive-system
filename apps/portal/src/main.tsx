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
  
  // Load UMD bundles after React globals are exposed
  const currentOrigin = window.location.origin;
  
  // Load Sanad AI bundle
  const sanadScript = document.createElement('script');
  sanadScript.src = `${currentOrigin}/sanad-ai.umd.js`;
  document.head.appendChild(sanadScript);
  
  // Load Muhallil Ahkam bundle
  const ahkamScript = document.createElement('script');
  ahkamScript.src = `${currentOrigin}/muhallil-ahkam.umd.js`;
  document.head.appendChild(ahkamScript);
  
  // Load Legal Stats Bot (محلل الرؤى والتوقعات) from external URL
  document.addEventListener('DOMContentLoaded', function () {
    const statsBotScript = document.createElement('script');
    statsBotScript.src = 'https://legal-stats.momrahai.com/legal-analyst.umd.js';
    document.body.appendChild(statsBotScript);
    
    // Load Legal Assistant (المذكرة القانونية) from external URL
    const legalAssistantScript = document.createElement('script');
    legalAssistantScript.src = 'https://legal-assistant-v2.momrahai.com/legal-assistant-v1.1.umd.js';
    document.body.appendChild(legalAssistantScript);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

