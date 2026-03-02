import { FormField, FormSwitch } from '@/modules/shared';

export interface UrgentMeetingFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UrgentMeetingField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  className,
}: UrgentMeetingFieldProps) {
  return (
    <FormField
      label="اجتماع عاجل؟"
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
