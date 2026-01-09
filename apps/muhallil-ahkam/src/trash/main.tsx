import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatApp } from './app';

// Get basic auth from environment variables
const getBasicAuth = () => {
  const username = import.meta.env.VITE_API_BASIC_AUTH_USERNAME;
  const password = import.meta.env.VITE_API_BASIC_AUTH_PASSWORD;
  const authString = import.meta.env.VITE_API_BASIC_AUTH;

  if (authString) {
    return { authString };
  }

  if (username && password) {
    return { username, password };
  }

  return undefined;
};

// Default config for dev mode
const defaultConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  basicAuth: getBasicAuth(),
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChatApp config={defaultConfig} />
  </React.StrictMode>
);

