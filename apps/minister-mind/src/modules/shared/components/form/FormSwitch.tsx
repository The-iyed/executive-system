import React from 'react';
import { cn } from '@sanad-ai/ui';

export interface FormSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  showLabelWhenChecked?: boolean;
  checkedLabel?: string;
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  className,
  disabled = false,
  showLabelWhenChecked = false,
  checkedLabel = 'نعم',
}) => {
  return (
    <div className={cn('flex items-start flex-col gap-3 ml-4 sm:ml-0', className)}>
      {label && (
        <span
          className="text-right text-[14px] font-medium text-[#344054] whitespace-nowrap"
        >
          {label}
        </span>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            onCheckedChange(!checked);
          }}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#008774] focus:ring-offset-2',
            checked ? 'bg-[#008774]' : 'bg-[#D0D5DD]',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none select-none'
          )}
          style={{ padding: '2px' }}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out',
              checked ? '-translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        {label && checked && showLabelWhenChecked && (
          <span
            className={cn("font-medium text-[14px] leading-[20px] font-normal text-[#344054]")}
          >
            {checkedLabel}
          </span>
        )}
      </div>
    </div>
  );
};

FormSwitch.displayName = 'FormSwitch';
