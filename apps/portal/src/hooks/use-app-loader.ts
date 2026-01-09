import { useState, useEffect, useRef } from 'react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactQuery from '@tanstack/react-query';
import { AppMetadata, AppMount, AppConfig, loadAppMount } from '@sanad-ai/config';

export interface UseAppLoaderResult {
  isLoading: boolean;
  error: Error | null;
  mount: (element: HTMLElement, config: AppConfig) => void;
  unmount: () => void;
}

export const useAppLoader = (app: AppMetadata): UseAppLoaderResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [appMount, setAppMount] = useState<AppMount | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const linkRef = useRef<HTMLLinkElement | null>(null);
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

    // Load CSS file if it exists
    const cssPath = app.bundlePath.replace('.bundle.js', '.bundle.css');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    linkRef.current = link;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = app.bundlePath;
    script.async = true;
    scriptRef.current = script;

    script.onload = () => {
      const mount = loadAppMount(app.globalName);
      if (mount) {
        setAppMount(mount);
        setIsLoading(false);
      } else {
        setError(new Error(`Failed to load app mount for ${app.name}`));
        setIsLoading(false);
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
      if (linkRef.current && linkRef.current.parentNode) {
        linkRef.current.parentNode.removeChild(linkRef.current);
      }
      if (appMount && mountedElementRef.current) {
        appMount.unmount();
        mountedElementRef.current = null;
      }
    };
  }, [app.bundlePath, app.globalName, app.name]);

  const mount = (element: HTMLElement, config: AppConfig): void => {
    if (appMount) {
      mountedElementRef.current = element;
      appMount.mount(element, config);
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

