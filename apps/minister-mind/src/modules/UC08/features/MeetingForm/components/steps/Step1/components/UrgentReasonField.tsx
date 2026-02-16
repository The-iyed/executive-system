import { FormTextArea } from '@shared';

export interface UrgentReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UrgentReasonField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  className,
}: UrgentReasonFieldProps) {
  return (
    <div className={className}>
      <FormTextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        error={touched && error ? error : undefined}
        label="السبب"
        placeholder="السبب..."
        disabled={disabled}
      />
    </div>
  );
}
