import { FormField, FormSelect } from '@shared';
import { CONFIDENTIALITY_OPTIONS } from '../../../../utils';

export interface MeetingConfidentialityFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MeetingConfidentialityField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  className,
}: MeetingConfidentialityFieldProps) {
  return (
    <FormField
      className={className}
      label="سريّة الاجتماع"
      error={touched ? error : undefined}
    >
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={CONFIDENTIALITY_OPTIONS}
        placeholder="سريّة الاجتماع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
