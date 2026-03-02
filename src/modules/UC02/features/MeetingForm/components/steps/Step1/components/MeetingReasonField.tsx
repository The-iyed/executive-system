import { FormField, FormInput } from "@/modules/shared";

export interface MeetingReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingReasonField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  className,
}: MeetingReasonFieldProps) {
  return (
    <FormField
      className={className}
      label="مبرّر اللقاء"
      required={required}
      error={touched ? error : undefined}
    >
      <FormInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="مبرّر اللقاء"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
