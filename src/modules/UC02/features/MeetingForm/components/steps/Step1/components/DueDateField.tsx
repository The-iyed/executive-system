import { FormField, FormDatePicker } from '@/modules/shared';

export interface DueDateFieldProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function DueDateField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  className,
}: DueDateFieldProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <FormField
      className={className}
      label="تاريخ الاستحقاق"
      required={required}
      error={touched ? error : undefined}
    >
      <FormDatePicker
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onBlur={onBlur}
        placeholder="dd/mm/yyyy"
        error={!!(touched && error)}
        disabled={disabled}
        fromDate={today}
      />
    </FormField>
  );
}
