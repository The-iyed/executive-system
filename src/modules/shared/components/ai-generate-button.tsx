import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/ui';
import AiGeneratorButtonBg from '../assets/AiGeneratorButton.svg?react';

export interface AIGenerateButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const AIGenerateButton: React.FC<AIGenerateButtonProps> = ({
  onClick,
  label = 'توليد بالذكاء الاصطناعي',
  className,
  disabled = false,
  variant = 'primary',
}) => {
  const isSecondary = variant === 'secondary';
  return (
    <>
      <style>{`
        @keyframes ai-button-shimmer {
          0%, 100% {
            opacity: 1;
            filter: brightness(1);
          }
          50% {
            opacity: 0.95;
            filter: brightness(1.15);
          }
        }
        
        @keyframes ai-button-sparkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: scale(1.15) rotate(90deg);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 0.85;
          }
          75% {
            transform: scale(1.15) rotate(270deg);
            opacity: 0.9;
          }
        }
      `}</style>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          // Primary variant styles (default)
          !isSecondary && [
            'w-[190px] h-[44px]',
            'p-[12px_14px]',
            'rounded-[74px]',
          ],
          // Secondary variant styles
          isSecondary && [
            'w-[150px] h-[47px]',
            'p-[12px_14px]',
            'rounded-[30px]',
            'bg-[#34C3BA]',
          ],
          'relative flex items-center justify-center gap-2',
          'overflow-hidden transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:scale-[1.02] active:scale-[0.98]',
          // Primary variant shadow
          !isSecondary && 'box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03), inset 0px 0px 8.8px rgba(0, 135, 116, 0.24)',
          className
        )}
        style={
          isSecondary
            ? {
                boxShadow: 'inset 0px 0.305164px 13.4577px rgba(51, 51, 51, 0.8)',
                filter: 'drop-shadow(0px 1.22066px 13.885px rgba(4, 143, 134, 0.3))',
              }
            : undefined
        }
      >
        {/* Blurred background layer for secondary variant */}
        {isSecondary && (
          <div
            className="absolute inset-0 bg-[#87F8F8] pointer-events-none z-0"
            style={{
              filter: 'blur(12.5728px)',
            }}
          />
        )}

        {/* SVG Background (primary variant only) */}
        {!isSecondary && (
          <AiGeneratorButtonBg 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}
        
        {/* Content Layer */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          <Sparkles 
            className={cn(
              'w-4 h-4',
              !isSecondary && 'text-[#009883]',
              isSecondary && 'text-white'
            )}
            style={{
              animation: 'ai-button-sparkle 2s ease-in-out infinite',
            }}
          />
          <span
            className={cn(
              'font-medium leading-[20px]',
              !isSecondary && [
                'text-[14px] font-normal text-[#009883]',
              ],
              isSecondary && [
                'text-[12px] font-medium text-white',
              ]
            )}
          >
            {label}
          </span>
        </div>
      </button>
    </>
  );
};
