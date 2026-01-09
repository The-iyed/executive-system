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
    return (
      <div className="app-loader-error p-4 bg-red-50 border border-red-200 rounded-lg" dir="rtl">
        <p className="text-red-800 font-semibold mb-2">خطأ في تحميل {app.name}</p>
        <p className="text-red-600 text-sm mb-2">{error.message}</p>
        <p className="text-red-600 text-xs">
          تأكد من بناء التطبيق أولاً: <code className="bg-red-100 px-2 py-1 rounded">nx build {app.name}</code>
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`app-container app-${app.name} w-full h-full`}
      style={{ 
        height: '100%', 
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

