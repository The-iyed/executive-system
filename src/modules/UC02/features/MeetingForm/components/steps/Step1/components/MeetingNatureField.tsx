import { FormField, FormSelect } from '@/modules/shared';
import { MEETING_NATURE_OPTIONS } from '../../../../utils';

export interface MeetingNatureFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingNatureField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: MeetingNatureFieldProps) {
  return (
    <FormField
      className={className}
      label="طبيعة الاجتماع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormSelect
        value={value || ''}
        onValueChange={onChange}
        onBlur={onBlur}
        options={MEETING_NATURE_OPTIONS}
        placeholder="طبيعة الاجتماع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
