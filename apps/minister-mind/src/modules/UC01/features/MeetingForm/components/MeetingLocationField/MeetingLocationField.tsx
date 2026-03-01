import React from 'react';
import { FormField, FormInput, FormSelect } from '@shared';
import {
  MEETING_LOCATION_OPTIONS,
  getMeetingLocationDropdownValue,
  showMeetingLocationOtherInput,
} from '../../utils/constants';
import type { Step1BasicInfoFormData } from '../../schemas/step1BasicInfo.schema';
import type { Step1ErrorKey } from '../../hooks/useStep1BasicInfo';

export interface MeetingLocationFieldProps {
  formData: Pick<
    Partial<Step1BasicInfoFormData>,
    'meeting_location' | 'meeting_location_option'
  >;
  errors: Partial<Record<Step1ErrorKey, string>>;
  touched: Partial<Record<Step1ErrorKey, boolean>>;
  handleChange: (field: keyof Step1BasicInfoFormData, value: unknown) => void;
  handleBlur: (field: Step1ErrorKey) => void;
  isFieldDisabled: (field: string) => boolean;
  isRequired: boolean;
}

export const MeetingLocationField: React.FC<MeetingLocationFieldProps> = ({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  isFieldDisabled,
  isRequired,
}) => {
  const locationError = touched.meeting_location ? errors.meeting_location : undefined;
  const hasError = !!(touched.meeting_location && errors.meeting_location);

  const dropdownValue = getMeetingLocationDropdownValue(
    formData.meeting_location,
    formData.meeting_location_option
  );
  const showOtherInput = showMeetingLocationOtherInput(
    formData.meeting_location,
    formData.meeting_location_option
  );

  return (
    <>
      <FormField
        className="w-full min-w-0"
        label="الموقع"
        required={isRequired}
        error={locationError}
      >
        <FormSelect
          value={dropdownValue || undefined}
          onValueChange={(value) => handleChange('meeting_location_option', value ?? '')}
          options={MEETING_LOCATION_OPTIONS}
          placeholder="اختر الموقع"
          error={hasError}
          disabled={isFieldDisabled('meeting_location')}
        />
      </FormField>
      {showOtherInput && (
        <FormField
          className="w-full min-w-0"
          label="تحديد الموقع (موقع آخر)"
          required={isRequired}
          error={locationError}
        >
          <FormInput
            value={formData.meeting_location || ''}
            onChange={(e) => handleChange('meeting_location', e.target.value)}
            onBlur={() => handleBlur('meeting_location')}
            placeholder="أدخل الموقع"
            error={hasError}
            disabled={isFieldDisabled('meeting_location')}
          />
        </FormField>
      )}
    </>
  );
};
