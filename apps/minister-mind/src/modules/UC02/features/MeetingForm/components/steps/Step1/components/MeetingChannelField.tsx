import { FormField, FormSelect } from '@shared';
import { MEETING_CHANNEL_OPTIONS } from '../../../../utils';

export interface MeetingChannelFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingChannelField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: MeetingChannelFieldProps) {
  return (
    <FormField
      className={className}
      label="آلية انعقاد الاجتماع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={MEETING_CHANNEL_OPTIONS}
        placeholder="حضوري / افتراضي / مختلط"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
