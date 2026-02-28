import { FormField, FormInput } from '@shared';

export interface RelatedTopicFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function RelatedTopicField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  className,
}: RelatedTopicFieldProps) {
  return (
    <FormField
      className={className}
      label="موضوع التكليف المرتبط"
      required={required}
      error={touched ? error : undefined}
    >
      <FormInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="موضوع التكليف المرتبط"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
