import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sanad-ai/ui';
import { FONT_FAMILY } from '../constants';

interface TooltipTextProps {
  text: string;
  className?: string;
  maxLines?: number;
  as?: 'h3' | 'p';
  preserveWhitespace?: boolean;
}

export const TooltipText: React.FC<TooltipTextProps> = ({
  text,
  className = '',
  maxLines = 1,
  as: Component = 'p',
  preserveWhitespace = false,
}) => {
  const lineClampStyle =
    maxLines > 1
      ? {
          display: '-webkit-box' as const,
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical' as const,
          wordBreak: 'break-word' as const,
        }
      : {};

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Component
            className={className}
            style={{ fontFamily: FONT_FAMILY, ...lineClampStyle }}
          >
            {text}
          </Component>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-md bg-gray-900 text-white border-gray-700 shadow-lg"
        >
          <p
            className={`text-right text-white ${preserveWhitespace ? 'whitespace-pre-wrap' : ''}`}
            style={{ fontFamily: FONT_FAMILY }}
          >
            {text}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
