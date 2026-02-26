import React from 'react';
import {
  cn,
  Loader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sanad-ai/ui';

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: FormSelectOption[];
  error?: boolean;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  /** Called when the select closes (blur / click outside). Use for touched/validation. */
  onBlur?: () => void;
  /** Called when the select opens (first click). Use to mark touched and show errors. */
  onFocus?: () => void;
  /** When true, shows a spinner in the trigger and disables the select. */
  loading?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  value,
  onValueChange,
  placeholder = '-------',
  options,
  error,
  className,
  disabled = false,
  onBlur,
  onFocus,
  loading = false,
}) => {
  const isDisabled = disabled || loading;

  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        // Guard: even if user removes disabled via devtools, ignore value change
        if (isDisabled) return;
        onValueChange?.(newValue);
      }}
      onOpenChange={(open) => {
        if (open) onFocus?.();
        else onBlur?.();
      }}
      disabled={isDisabled}
    >
      <SelectTrigger
        className={cn(
          'text-right h-[44px] p-[10px_14px] bg-[#FFFFFF] border border-[#D0D5DD] box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)] rounded-[8px] font-style-normal font-weight-400 font-size-16 line-height-24 color-[#667085]',
          'flex-row-reverse',
          'justify-between',
          'focus:outline-none focus:border-[#008774]',
          error && 'border-[#D13C3C]',
          !error && 'focus:border-[#008774]',
          isDisabled && 'cursor-not-allowed pointer-events-none select-none',
          className
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-[#667085]">
            <Loader size={18} />
            <span>{placeholder}</span>
          </span>
        ) : (
          <SelectValue 
            placeholder={placeholder} 
            className="text-right font-style-normal font-weight-400 font-size-16 line-height-24 color-[#667085]"
          />
        )}
      </SelectTrigger>
      <SelectContent dir="rtl">
        {options?.map((option, index) => (
            <SelectItem
              key={`option-${index}`}
              value={option?.value}
            >
              {option?.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

FormSelect.displayName = 'FormSelect';
