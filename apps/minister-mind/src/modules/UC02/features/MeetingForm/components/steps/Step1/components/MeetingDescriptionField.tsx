import { FormField, FormInput } from '@shared';

export interface MeetingDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MeetingDescriptionField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  className,
}: MeetingDescriptionFieldProps) {
  return (
    <FormField
      className={className}
      label="وصف الاجتماع"
      error={touched ? error : undefined}
    >
      <FormInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="وصف الاجتماع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
