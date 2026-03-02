import { FormField, FormInput, FormSelect } from '@/modules/shared';
import type { Step1FormData } from '../../../../schemas/step1.schema';
import {
  MEETING_LOCATION_OPTIONS,
  getLocationDropdownValue,
  showLocationOtherInput,
} from '../../../../utils/constants';

export interface LocationFieldProps {
  formData: Pick<Partial<Step1FormData>, 'location' | 'location_option'>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  touched: Partial<Record<keyof Step1FormData, boolean>>;
  handleChange: (field: keyof Step1FormData, value: unknown) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  isFieldDisabled: (field: keyof Step1FormData) => boolean;
  isRequired: boolean;
  className?: string;
}

export function LocationField({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  isFieldDisabled,
  isRequired,
  className,
}: LocationFieldProps) {
  const locationError = touched.location ? errors.location : undefined;
  const hasError = !!(touched.location && errors.location);

  const dropdownValue = getLocationDropdownValue(formData.location, formData.location_option);
  const showOtherInput = showLocationOtherInput(formData.location, formData.location_option);

  return (
    <>
      <FormField
        className={className}
        label="الموقع"
        required={isRequired}
        error={locationError}
      >
        <FormSelect
          value={dropdownValue || undefined}
          onValueChange={(value) => handleChange('location_option', value ?? '')}
          options={MEETING_LOCATION_OPTIONS}
          placeholder="اختر الموقع"
          error={hasError}
          disabled={isFieldDisabled('location')}
        />
      </FormField>
      {showOtherInput && (
        <FormField
          className={className}
          label="تحديد الموقع (موقع آخر)"
          required={isRequired}
          error={locationError}
        >
          <FormInput
            value={formData.location ?? ''}
            onChange={(e) => handleChange('location', e.target.value)}
            onBlur={() => handleBlur('location')}
            placeholder="أدخل الموقع"
            error={hasError}
            disabled={isFieldDisabled('location')}
          />
        </FormField>
      )}
    </>
  );
}
