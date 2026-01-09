import React from 'react';

export interface ChatInterfaceProps {
  apiBaseUrl: string;
  onMessage?: (message: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ apiBaseUrl: _apiBaseUrl, onMessage: _onMessage }) => {
  return (
    <div className="chat-interface">
      <p>Chat interface using @ai-elements/all</p>
    </div>
  );
};

