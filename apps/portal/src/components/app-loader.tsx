import React, { useEffect, useRef } from 'react';
import { AppMetadata } from '@sanad-ai/config';
import { useAppLoader } from '../hooks/use-app-loader';

export interface AppLoaderProps {
  app: AppMetadata;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ app }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoading, error, mount, unmount } = useAppLoader(app);

  useEffect(() => {
    if (containerRef.current && !isLoading && !error) {
      mount(containerRef.current);
    }

    return () => {
      unmount();
    };
  }, [isLoading, error, mount, unmount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
        <div className="flex flex-col items-center gap-6">
          {/* Animated spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 border-4 border-teal-300 rounded-full border-r-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Loading text with pulse animation */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-semibold text-gray-800 animate-pulse" style={{ fontFamily: 'Frutiger LT Arabic, sans-serif' }}>
              جارٍ تحميل {app.name}...
            </p>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
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

