import { useCallback } from 'react';
import { FormField, FormInput, FormAsyncSelectV2 } from '@/modules/shared';
import type { OptionType } from '@/modules/shared';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../utils';
import { getMeetingsSearchForPrevious } from '../../../../../../data';

export interface PreviousMeetingFieldProps {
  value: OptionType | string | null;
  onChange: (value: OptionType | string | null) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  visible?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function PreviousMeetingField({
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  visible = true,
  readOnly = false,
  className,
}: PreviousMeetingFieldProps) {
  const loadOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getMeetingsSearchForPrevious({
        q: search.trim(),
        skip,
        limit: limit || STEP1_ASYNC_SELECT_PAGE_SIZE,
      });
      const items = (response?.items ?? []).map((m) => ({
        value: String(m.id),
        label: m.meeting_title || m.original_title,
      }));
      return {
        items,
        total: response?.total ?? 0,
        skip: response?.skip ?? 0,
        limit: response?.limit ?? limit,
        has_next: (response?.total ?? 0) > (response?.skip ?? 0) + items.length,
        has_previous: (response?.skip ?? 0) > 0,
      };
    },
    []
  );

  if (!visible) return null;

  const displayValue = typeof value === 'object' && value !== null ? value.label : (value ?? '');
  const optionValue =
    typeof value === 'object' && value !== null ? value : (value ? { value: value as string, label: displayValue } : null);

  if (readOnly) {
    return (
      <FormField className={className} label="الاجتماع السابق" required={required} error={touched ? error : undefined}>
        <FormInput
          value={displayValue as string}
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
    <FormField className={className} label="الاجتماع السابق" required={required} error={touched ? error : undefined}>
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
