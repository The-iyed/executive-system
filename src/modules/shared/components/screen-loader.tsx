import React from 'react';
import { cn } from '@/lib/ui';

interface ScreenLoaderProps {
  message?: string;
  className?: string;
}

export const ScreenLoader: React.FC<ScreenLoaderProps> = ({ 
  message = 'جاري التحميل...',
  className = ''
}) => {
  return (
    <div className={cn('fixed inset-0 flex items-center justify-center bg-white z-50', className)}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#048F86] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
};


export const  Loader: React.FC<ScreenLoaderProps> = ({
  message = 'جاري التحميل...'
}) => {
  return (
    <div className="flex flex-col justify-center w-full h-full items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#048F86] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
};