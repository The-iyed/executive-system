import { FormField, FormSelect, MEETING_CATEGORY_OPTIONS } from '@/modules/shared';

export interface MeetingCategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingCategoryField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: MeetingCategoryFieldProps) {
  return (
    <FormField
      className={className}
      label="فئة الاجتماع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={[...MEETING_CATEGORY_OPTIONS]}
        placeholder="فئة الاجتماع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
