import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AppMount, AppConfig } from '@sanad-ai/config';
import { ChatApp } from './app';

export const createMount = (): AppMount => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  return {
    mount: (el: HTMLElement, config: AppConfig) => {
      container = el;
      root = createRoot(el);
      root.render(
        <React.StrictMode>
          <ChatApp config={config} />
        </React.StrictMode>
      );
    },
    unmount: () => {
      if (root && container) {
        root.unmount();
        root = null;
        container = null;
      }
    },
  };
};


