import React from 'react';
import { cn } from '@sanad-ai/ui';
import { Check } from 'lucide-react';

export interface FormCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  checked,
  onCheckedChange,
  label,
  required = false,
  error,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'flex items-center justify-center',
            'w-5 h-5 rounded border-2 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-[#008774] focus:ring-offset-2',
            checked
              ? 'bg-[#008774] border-[#008774]'
              : 'bg-white border-[#D0D5DD] hover:border-[#008774]',
            error && 'border-[#D13C3C]'
          )}
        >
          {checked && <Check className="w-4 h-4 text-white" />}
        </button>
        <label
          className={cn(
            'text-right text-[14px] font-medium text-[#344054] cursor-pointer',
            error && 'text-[#D13C3C]'
          )}
          onClick={() => onCheckedChange(!checked)}
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      </div>
      {error && (
        <p className="text-right text-[#D13C3C] text-[14px] font-normal">
          {error}
        </p>
      )}
    </div>
  );
};
