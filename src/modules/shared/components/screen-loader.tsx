import React from 'react';
import { cn } from '@/lib/ui';
import { AnimatedLogomark } from './AnimatedLogomark';

interface ScreenLoaderProps {
  message?: string;
  className?: string;
}

export const ScreenLoader: React.FC<ScreenLoaderProps> = ({ 
  message,
  className = ''
}) => {
  return (
    <div className={cn('fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50', className)}>
      <div className="flex flex-col items-center gap-4">
        <AnimatedLogomark size={56} />
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-lg font-bold text-foreground">المنصة الموحدة</h1>
          <p className="text-sm text-muted-foreground">للشؤون التنفيذية بمكتب معالي الوزير</p>
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
};


export const Loader: React.FC<ScreenLoaderProps> = ({
  message
}) => {
  return (
    <div className="flex flex-col justify-center w-full h-full items-center gap-4">
      <AnimatedLogomark size={56} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
};
