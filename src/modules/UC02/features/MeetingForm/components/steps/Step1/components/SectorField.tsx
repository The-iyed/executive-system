import { FormField, FormSelect } from '@/modules/shared';
import { SECTOR_OPTIONS } from '../../../../utils';

export interface SectorFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function SectorField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: SectorFieldProps) {
  return (
    <FormField
      className={className}
      label="القطاع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={SECTOR_OPTIONS}
        placeholder="القطاع"
        error={!!(touched && error)}
        disabled={disabled}
      />
    </FormField>
  );
}
