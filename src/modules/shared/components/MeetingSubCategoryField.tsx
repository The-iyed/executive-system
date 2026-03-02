import { FormField, FormSelect } from './form';
import { MEETING_SUB_CATEGORY_OPTIONS } from '../types/meeting';

export interface MeetingSubCategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingSubCategoryField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = false,
  className,
}: MeetingSubCategoryFieldProps) {
  return (
    <FormField
      className={className}
      label="الفئة الفرعية"
      required={required}
      error={touched ? error : undefined}
    >
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={MEETING_SUB_CATEGORY_OPTIONS}
        placeholder="اختر الفئة الفرعية"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}