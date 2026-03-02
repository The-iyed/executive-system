import { FormTextArea } from '@/modules/shared';

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
    <div className={className}>
      <FormTextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        error={touched && error ? error : undefined}
        label="مبرّر اللقاء"
        placeholder="مبرّر اللقاء..."
        disabled={disabled}
        required={required}
      />
    </div>
  );
}
