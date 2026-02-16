import { FormField, FormDatePicker } from '@shared';

export interface DueDateFieldProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DueDateField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  className,
}: DueDateFieldProps) {
  return (
    <FormField
      className={className}
      label="تاريخ الاستحقاق"
      error={touched ? error : undefined}
    >
      <FormDatePicker
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onBlur={onBlur}
        placeholder="dd/mm/yyyy"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
