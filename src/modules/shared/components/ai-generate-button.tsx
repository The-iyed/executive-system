import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/ui';

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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center justify-center gap-2 overflow-hidden transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:scale-[1.02] active:scale-[0.98]',
        !isSecondary && 'h-[38px] px-4 rounded-xl',
        isSecondary && 'h-[38px] px-4 rounded-xl',
        className
      )}
      style={{
        background: isSecondary
          ? 'linear-gradient(135deg, #34C3BA 0%, #048F86 100%)'
          : 'linear-gradient(135deg, #048F86 0%, #34C3BA 100%)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      }}
    >
      <Sparkles className="w-4 h-4 text-white/90" />
      <span className="text-[13px] font-semibold text-white whitespace-nowrap">
        {label}
      </span>
    </button>
  );
};
