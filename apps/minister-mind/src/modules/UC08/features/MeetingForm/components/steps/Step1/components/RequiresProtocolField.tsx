import { FormField, FormSwitch } from '@shared';

export interface RequiresProtocolFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RequiresProtocolField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  className,
}: RequiresProtocolFieldProps) {
  return (
    <FormField
      label="هل يتطلب بروتوكول؟"
      error={touched ? error : undefined}
      className={className}
    >
      <FormSwitch
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </FormField>
  );
}
