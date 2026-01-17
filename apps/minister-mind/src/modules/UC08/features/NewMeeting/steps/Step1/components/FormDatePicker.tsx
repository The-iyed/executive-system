import React from 'react';
import { DatePicker } from '@sanad-ai/ui';

export interface FormDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'dd:mm:yyyy',
  error,
  className,
}) => {
  return (
      <DatePicker
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        error={error}
        className={className}
      />
  );
};

FormDatePicker.displayName = 'FormDatePicker';
