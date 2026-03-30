import React from 'react';
import { cn } from '@/lib/ui';
import LogomarkSvg from '@/modules/shared/assets/Logomark.svg';

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
        <img
          src={LogomarkSvg}
          alt="Loading"
          className="w-14 h-14 animate-pulse drop-shadow-lg"
        />
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
      <img
        src={LogomarkSvg}
        alt="Loading"
        className="w-14 h-14 animate-pulse drop-shadow-lg"
      />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
};
