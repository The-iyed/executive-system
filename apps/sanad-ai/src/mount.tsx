import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppMount } from '@sanad-ai/config';
import { ChatApp } from './app';

export const createMount = (): AppMount => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  return {
    mount: (el: HTMLElement) => {
      container = el;
      root = createRoot(el);
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <ChatApp />
          </BrowserRouter>
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




