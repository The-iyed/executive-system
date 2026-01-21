import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sanad-ai/ui';
import { cn } from '@sanad-ai/ui';

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
}

export const FormSelect: React.FC<FormSelectProps> = ({
  value,
  onValueChange,
  placeholder = '-------',
  options,
  error,
  className,
  disabled = false,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'text-right h-[44px] p-[10px_14px] bg-[#FFFFFF] border border-[#D0D5DD] box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)] rounded-[8px] font-style-normal font-weight-400 font-size-16 line-height-24 color-[#667085]',
          'flex-row-reverse',
          'justify-between',
          'focus:outline-none focus:border-[#008774]',
          error && 'border-[#D13C3C]',
          !error && 'focus:border-[#008774]',
          className
        )}
      >
        <SelectValue 
          placeholder={placeholder} 
          className="text-right font-style-normal font-weight-400 font-size-16 line-height-24 color-[#667085]"
        />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

FormSelect.displayName = 'FormSelect';
