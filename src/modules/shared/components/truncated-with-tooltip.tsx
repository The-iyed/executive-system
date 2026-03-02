import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/lib/ui';
import { cn } from '@/lib/ui';

export interface TruncatedWithTooltipProps {
  /** Content to display (truncated) */
  children: React.ReactNode;
  /** Tooltip text on hover (defaults to children if string) */
  title?: string;
  className?: string;
}

export const TruncatedWithTooltip: React.FC<TruncatedWithTooltipProps> = ({
  children,
  title,
  className = '',
}) => {
  const tooltipText = title ?? (typeof children === 'string' ? children : undefined);
  const baseClasses = 'text-base font-normal text-right text-gray-600 leading-5 block w-full max-w-[200px] truncate';

  if (tooltipText == null || tooltipText === '') {
    return <span className={cn(baseClasses, className)}>{children}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(baseClasses, className)}>{children}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px] text-right">
          <p className="whitespace-pre-wrap break-words">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
