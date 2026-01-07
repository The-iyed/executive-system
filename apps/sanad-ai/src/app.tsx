import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, createEnhancedApiClient } from '@sanad-ai/api';
import { AppConfig } from '@sanad-ai/config';
import { ChatInterface } from '@sanad-ai/chat/ui';
// Import app-specific APIs to register them
import './api/endpoints';

export interface ChatAppProps {
  config: AppConfig;
}

export const ChatApp: React.FC<ChatAppProps> = ({ config }) => {
  const queryClient = createQueryClient();
  const apiClient = createEnhancedApiClient({
    baseURL: config.apiBaseUrl,
    basicAuth: config.basicAuth,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <div className="sanad-chat-app">
        <ChatInterface apiBaseUrl={config.apiBaseUrl ?? ''} />
      </div>
    </QueryClientProvider>
  );
};

