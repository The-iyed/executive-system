import React from 'react';
import { DateTimePicker, cn } from '@/lib/ui';

export interface FormDateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  /** First selectable date/time; before this is disabled. */
  minDate?: Date;
  /** Last selectable date/time; after this is disabled (e.g. start + 24h). */
  maxDate?: Date;
  /** When value is empty, show this date (e.g. end picker: same day as start). */
  defaultDate?: Date;
  /** Lock to this date – user only picks time (same day). Use for end datetime. */
  lockedDate?: Date;
}

export const FormDateTimePicker: React.FC<FormDateTimePickerProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'اختر التاريخ والوقت',
  error,
  className,
  disabled,
  fullWidth = false,
  minDate,
  maxDate,
  defaultDate,
  lockedDate,
}) => {
  return (
    <DateTimePicker
      value={value}
      onChange={(newValue) => {
        if (disabled) return;
        onChange?.(newValue);
      }}
      onBlur={onBlur}
      placeholder={placeholder}
      error={error}
      className={cn(
        fullWidth && 'w-full',
        disabled && 'cursor-not-allowed pointer-events-none select-none',
        className
      )}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      defaultDate={defaultDate}
      lockedDate={lockedDate}
    />
  );
};

FormDateTimePicker.displayName = 'FormDateTimePicker';
