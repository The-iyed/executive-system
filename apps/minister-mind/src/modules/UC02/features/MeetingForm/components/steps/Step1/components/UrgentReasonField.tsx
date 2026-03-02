import { FormField, FormInput } from '@shared';

export interface UrgentReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function UrgentReasonField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  className,
}: UrgentReasonFieldProps) {
  const showError = Boolean(touched || error);
  return (
    <FormField
      className={className}
      label="السبب"
      required={required}
      error={showError ? error : undefined}
    >
      <FormInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="السبب..."
        error={!!(showError && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
