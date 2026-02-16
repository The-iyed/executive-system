import React from 'react';
import { FormField, FormInput, FormAsyncSelectV2 } from '@shared';
import type { OptionType } from '@shared';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../constants/step1.constants';

export interface PreviousMeetingFieldProps {
  /** When visible, use async select; value can be OptionType (id + label) or string (legacy display) */
  value: OptionType | string | null;
  onChange: (value: OptionType | string | null) => void;
  onBlur?: () => void;
  loadOptions: (search: string, skip: number, limit: number) => Promise<{
    items: Array<OptionType & { description?: string }>;
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
  visible?: boolean;
  /** When true, show as read-only text (e.g. from directive); when false and visible, show async select */
  readOnly?: boolean;
  className?: string;
}

/**
 * Previous Meeting (الاجتماع السابق). Hidden when Nature = Normal; required when Follow-up or Recurring.
 * Supports async search when visible and not read-only.
 */
export function PreviousMeetingField({
  value,
  onChange,
  onBlur,
  loadOptions,
  error,
  touched,
  disabled = false,
  required = false,
  visible = true,
  readOnly = false,
  className,
}: PreviousMeetingFieldProps) {
  if (!visible) return null;

  const displayValue = typeof value === 'object' && value !== null ? value.label : (value ?? '');
  const optionValue =
    typeof value === 'object' && value !== null ? value : (value ? { value: value as string, label: displayValue } : null);

  if (readOnly) {
    return (
      <FormField
        className={className}
        label="الاجتماع السابق"
        required={required}
        error={touched ? error : undefined}
      >
        <FormInput
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="الاجتماع السابق"
          error={!!(touched && error)}
          disabled
          readOnly
        />
      </FormField>
    );
  }

  return (
    <FormField
      className={className}
      label="الاجتماع السابق"
      required={required}
      error={touched ? error : undefined}
    >
      <FormAsyncSelectV2
        value={optionValue as OptionType | null}
        onValueChange={(v) => onChange(v)}
        loadOptions={loadOptions}
        placeholder="الاجتماع السابق"
        isSearchable
        isClearable={!required}
        isDisabled={disabled}
        error={!!(touched && error)}
        errorMessage={touched ? error ?? null : null}
        searchPlaceholder="البحث..."
        emptyMessage="لم يتم العثور على نتائج."
        fullWidth
        limit={STEP1_ASYNC_SELECT_PAGE_SIZE}
      />
    </FormField>
  );
}
