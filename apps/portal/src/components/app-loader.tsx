import React, { useEffect, useRef } from 'react';
import { AppMetadata, AppConfig } from '@sanad-ai/config';
import { useAppLoader } from '../hooks/use-app-loader';

export interface AppLoaderProps {
  app: AppMetadata;
  config?: AppConfig;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ app, config = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoading, error, mount, unmount } = useAppLoader(app);

  useEffect(() => {
    if (containerRef.current && !isLoading && !error) {
      mount(containerRef.current, config);
    }

    return () => {
      unmount();
    };
  }, [isLoading, error, mount, unmount, config]);

  if (isLoading) {
    return <div className="app-loader-loading">Loading {app.name}...</div>;
  }

  if (error) {
    return <div className="app-loader-error">Error loading {app.name}: {error.message}</div>;
  }

  return <div ref={containerRef} className={`app-container app-${app.name}`} />;
};

