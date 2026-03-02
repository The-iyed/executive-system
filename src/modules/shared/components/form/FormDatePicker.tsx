import React from 'react';
import { DatePicker } from '@/lib/ui';

export interface FormDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  /** First selectable date; dates before this are disabled. */
  fromDate?: Date;
  /** Last selectable date; dates after this are disabled. */
  toDate?: Date;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "dd/mm/yyyy",
  error,
  className,
  disabled,
  fullWidth = false,
  fromDate,
  toDate,
}) => {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      error={error}
      className={fullWidth ? `${className || ''} w-full`.trim() : className}
      disabled={disabled}
      fromDate={fromDate}
      toDate={toDate}
    />
  );
};

FormDatePicker.displayName = 'FormDatePicker';
