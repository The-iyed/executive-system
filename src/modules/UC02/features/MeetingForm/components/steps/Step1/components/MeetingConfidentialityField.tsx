import { FormField, FormSwitch } from '@/modules/shared';

/** Default when not set: عادي (non-confidential). */
const DEFAULT_CONFIDENTIALITY = 'NORMAL';

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
  const effectiveValue = value || DEFAULT_CONFIDENTIALITY;
  const isConfidential = effectiveValue === 'CONFIDENTIAL';
  return (
    <FormField
      className={className}
      label="سريّة الاجتماع"
      error={touched ? error : undefined}
    >
      <FormSwitch
        checked={isConfidential}
        onCheckedChange={(checked) => onChange(checked ? 'CONFIDENTIAL' : 'NORMAL')}
        label="اجتماع سرّي؟"
        disabled={disabled}
      />
    </FormField>
  );
}
