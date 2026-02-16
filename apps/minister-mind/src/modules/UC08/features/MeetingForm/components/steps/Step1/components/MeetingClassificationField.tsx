import { FormField, FormSelect } from '@shared';
import { MEETING_CLASSIFICATION_OPTIONS } from '../../../../utils';

export interface MeetingClassificationFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingClassificationField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: MeetingClassificationFieldProps) {
  return (
    <FormField
      className={className}
      label="تصنيف الاجتماع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={MEETING_CLASSIFICATION_OPTIONS}
        placeholder="تصنيف الاجتماع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
