import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@sanad-ai/ui';
import AiGeneratorButtonBg from '../assets/AiGeneratorButton.svg?react';

export interface AIGenerateButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const AIGenerateButton: React.FC<AIGenerateButtonProps> = ({
  onClick,
  label = 'توليد بالذكاء الاصطناعي',
  className,
  disabled = false,
}) => {
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
          'w-[190px] h-[44px]',
          'p-[12px_14px]',
          'rounded-[74px]',
          'relative flex items-center justify-center gap-2',
          'overflow-hidden transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:scale-[1.02] active:scale-[0.98]',
          'box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03), inset 0px 0px 8.8px rgba(0, 135, 116, 0.24)',
          className
        )}
      >
        {/* SVG Background */}
        <AiGeneratorButtonBg 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        
        {/* Content Layer */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          <Sparkles 
            className="w-4 h-4 text-[#009883]"
            style={{
              animation: 'ai-button-sparkle 2s ease-in-out infinite',
              color: 'linear-gradient(90deg, #009883 0%, #00BBA1 100%)',
            }}
          />
          <span
            className="font-medium text-[14px] leading-[20px] font-normal text-[#009883]"
          >
            {label}
          </span>
        </div>
      </button>
    </>
  );
};
