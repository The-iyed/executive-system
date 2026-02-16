import React from 'react';
import { FormField, FormSelect } from '@shared';
import { MEETING_NATURE_OPTIONS } from '../../../../constants/step1.constants';

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

/**
 * Nature of Meeting (طبيعة الاجتماع): Normal (عادي), Follow-up (إلحاقي), Recurring (دوري).
 * Required. Drives visibility of Previous Meeting and disabled state of other sections.
 */
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
        options={MEETING_NATURE_OPTIONS}
        placeholder="طبيعة الاجتماع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
