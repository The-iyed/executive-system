import { useState, useEffect, useRef } from 'react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactQuery from '@tanstack/react-query';
import { AppMetadata, AppMount, loadAppMount } from '@sanad-ai/config';

export interface UseAppLoaderResult {
  isLoading: boolean;
  error: Error | null;
  mount: (element: HTMLElement) => void;
  unmount: () => void;
}

export const useAppLoader = (app: AppMetadata): UseAppLoaderResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [appMount, setAppMount] = useState<AppMount | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const mountedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Expose React, ReactDOM, and ReactQuery as globals for the bundle
    if (typeof window !== 'undefined') {
      (window as any).React = React;
      (window as any).ReactDOM = ReactDOM;
      (window as any).ReactQuery = ReactQuery;
    }

    setIsLoading(true);
    setError(null);

    // CSS is inlined in the JS bundle, no need to load separately
    const script = document.createElement('script');
    script.src = app.bundlePath;
    script.async = true;
    scriptRef.current = script;

    script.onload = () => {
      // Check if window API is available (SanadAiV3 or MuhallilAhkam)
      const windowApi = app.name === 'sanad-ai' 
        ? (window as any).SanadAiV3 
        : (window as any).MuhallilAhkam;
      
      if (windowApi) {
        // Use window API directly - create a wrapper mount object
        // Container is optional - window API will create its own if not provided
        setAppMount({
          mount: (el?: HTMLElement) => {
            if (el) {
              mountedElementRef.current = el;
            }
            windowApi.open(el);
          },
          unmount: () => {
            windowApi.close();
            mountedElementRef.current = null;
          },
        });
        setIsLoading(false);
      } else {
        // Fallback to old mount API for backward compatibility
        const mount = loadAppMount(app.globalName);
        if (mount) {
          setAppMount(mount);
          setIsLoading(false);
        } else {
          setError(new Error(`Failed to load app for ${app.name}. Make sure the bundle is loaded.`));
          setIsLoading(false);
        }
      }
    };

    script.onerror = () => {
      setError(new Error(`Failed to load script for ${app.name}`));
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      if (appMount && mountedElementRef.current) {
        appMount.unmount();
        mountedElementRef.current = null;
      }
    };
  }, [app.bundlePath, app.globalName, app.name]);

  const mount = (element: HTMLElement): void => {
    if (appMount) {
      mountedElementRef.current = element;
      appMount.mount(element);
    }
  };

  const unmount = (): void => {
    if (appMount && mountedElementRef.current) {
      appMount.unmount();
      mountedElementRef.current = null;
    }
  };

  return {
    isLoading,
    error,
    mount,
    unmount,
  };
};

