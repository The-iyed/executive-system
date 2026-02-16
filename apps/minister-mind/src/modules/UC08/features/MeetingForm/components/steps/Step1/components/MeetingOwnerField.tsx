import { useCallback } from 'react';
import { FormField, FormAsyncSelectV2 } from '@shared';
import type { OptionType } from '@shared';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../utils';
import { getUsers } from '../../../../../../data';
import type { UserApiResponse } from '../../../../../../data';

export interface MeetingOwnerFieldProps {
  value: OptionType | null;
  onChange: (value: OptionType | null) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function MeetingOwnerField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: MeetingOwnerFieldProps) {
  const loadOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getUsers({
        search: search.trim() || undefined,
        skip,
        limit,
      });
      const items = (response?.items ?? []).map((u: UserApiResponse) => {
        const fullName =
          ([u.first_name, u.last_name].filter(Boolean).join(' ') || u?.username || u?.email) ?? '';
        return { value: u?.id ?? '', label: fullName };
      });
      return {
        items,
        total: response?.total ?? 0,
        skip: response?.skip ?? 0,
        limit: response?.limit ?? limit,
        has_next: response?.has_next ?? false,
        has_previous: response?.has_previous ?? false,
      };
    },
    []
  );

  return (
    <FormField
      className={className}
      label="مالك الاجتماع"
      required={required}
      error={touched ? error : undefined}
    >
      <FormAsyncSelectV2
        value={value ?? null}
        onValueChange={onChange}
        loadOptions={loadOptions}
        placeholder="مالك الاجتماع"
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
