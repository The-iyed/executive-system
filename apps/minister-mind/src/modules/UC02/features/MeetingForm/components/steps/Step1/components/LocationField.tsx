import { FormField, FormInput } from '@shared';

export interface LocationFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function LocationField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: LocationFieldProps) {
  return (
    <FormField
      className={className}
      label="الموقع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="الموقع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
