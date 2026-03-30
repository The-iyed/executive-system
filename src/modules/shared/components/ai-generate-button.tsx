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
        'hover:scale-[1.03] active:scale-[0.97] hover:shadow-lg',
        'h-[38px] px-5 rounded-xl shadow-md',
        isSecondary
          ? 'bg-gradient-to-l from-[#048F86] to-[#0BA89E] text-white'
          : 'bg-gradient-to-r from-[#048F86] via-[#069E95] to-[#0BB5AA] text-white',
        className
      )}
    >
      <Sparkles className="w-4 h-4 text-white/90" />
      <span className="text-[13px] font-semibold text-white whitespace-nowrap">
        {label}
      </span>
    </button>
  );
};
