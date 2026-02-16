import React from 'react';
import { FormField, FormAsyncSelectV2 } from '@shared';
import type { OptionType } from '@shared';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../constants/step1.constants';

export interface ApplicantFieldProps {
  value: OptionType | null;
  onChange: (value: OptionType | null) => void;
  onBlur?: () => void;
  loadOptions: (search: string, skip: number, limit: number) => Promise<{
    items: Array<OptionType>;
    total: number;
    skip: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  }>;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Applicant (مقدّم الطلب). User select, required.
 */
export function ApplicantField({
  value,
  onChange,
  loadOptions,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: ApplicantFieldProps) {
  return (
    <FormField
      className={className}
      label="مقدّم الطلب"
      required={required}
      error={touched ? error : undefined}
    >
      <FormAsyncSelectV2
        value={value ?? null}
        onValueChange={onChange}
        loadOptions={loadOptions}
        placeholder="مقدّم الطلب"
        isSearchable
        error={!!(touched && error)}
        errorMessage={touched ? error ?? null : null}
        fullWidth
        limit={STEP1_ASYNC_SELECT_PAGE_SIZE}
        searchPlaceholder="ابحث عن مستخدم..."
        emptyMessage="لم يتم العثور على مستخدمين"
        isDisabled={disabled}
      />
    </FormField>
  );
}
