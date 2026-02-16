import { FormField, FormSelect } from '@shared';
import { MEETING_TYPE_OPTIONS } from '../../../../utils';

export interface MeetingTypeFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingTypeField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: MeetingTypeFieldProps) {
  return (
    <FormField
      className={className}
      label="نوع الاجتماع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={MEETING_TYPE_OPTIONS}
        placeholder="نوع الاجتماع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
