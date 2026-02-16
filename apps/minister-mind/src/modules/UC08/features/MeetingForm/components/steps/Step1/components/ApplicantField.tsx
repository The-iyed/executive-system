import { useCallback } from 'react';
import { FormField, FormAsyncSelectV2, type OptionType } from '@shared';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../utils';
import { getUsers } from '../../../../../../data';
import type { UserApiResponse } from '../../../../../../data';
import { MeetingOwnerType } from '../../../../../../utils';

export interface ApplicantFieldProps {
  value: OptionType | null;
  onChange: (value: OptionType | null) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function ApplicantField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = true,
  className,
}: ApplicantFieldProps) {
  const loadOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getUsers({
        search: search.trim() || undefined,
        role_code: MeetingOwnerType.SUBMITTER,
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
