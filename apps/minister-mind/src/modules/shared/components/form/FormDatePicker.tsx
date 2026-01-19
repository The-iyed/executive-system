import React from 'react';
import { DatePicker } from '@sanad-ai/ui';

export interface FormDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'dd:mm:yyyy',
  error,
  className,
  disabled,
  fullWidth = false,
}) => {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      className={className}
      style={fullWidth ? { width: '100%' } : undefined}
    />
  );
};

FormDatePicker.displayName = 'FormDatePicker';
