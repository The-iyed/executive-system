import { FormField, FormInput } from '@shared';

export interface MeetingTitleFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingTitleField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: MeetingTitleFieldProps) {
  return (
    <FormField
      className={className}
      label="عنوان الاجتماع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="عنوان الاجتماع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
