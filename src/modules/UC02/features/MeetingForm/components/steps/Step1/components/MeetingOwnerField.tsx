import { useCallback } from 'react';
import { FormField, FormAsyncSelectV2, type OptionType } from '@/modules/shared';
import { getUserDisplayId, getUserDisplayLabel } from '@/modules/shared/utils';
import { searchUsersByEmail, type UserApiResponse } from '@/modules/UC02/data/usersApi';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../utils';

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
      const response = await searchUsersByEmail(search, skip, limit);
      const items = (response?.items ?? []).map((u: UserApiResponse) => {
        const rec = u as Record<string, unknown>;
        const id = (getUserDisplayId(rec) || u?.id) ?? '';
        const label = getUserDisplayLabel(rec) || 'غير محدد';
        return { value: id, label };
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
