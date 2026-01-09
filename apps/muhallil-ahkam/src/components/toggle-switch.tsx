import React from 'react';
import { cn } from '@sanad-ai/ui';

const FONT_FAMILY = '"Frutiger LT Arabic", "Cairo", "Tajawal", sans-serif';

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className="text-[14px] font-medium text-[#1A1A1A]"
        style={{ fontFamily: FONT_FAMILY }}
      >
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00A79D] focus:ring-offset-2',
          checked ? 'bg-[#00A79D]' : 'bg-[#E5E7EB]'
        )}
        style={{ padding: '2px' }}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out',
            checked ? 'translate-x-[-21px]' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
};