import { useCallback } from 'react';
import { FormAsyncSelectV2 } from '@shared';
import type { OptionType } from '@shared';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../utils';
import { getDirectivesPaginated } from '../../../../../../data';
import type { DirectiveApiResponse } from '../../../../../../data';

export interface GuidanceFieldProps {
  value: OptionType | null;
  onChange: (value: OptionType | null) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function GuidanceField({
  value,
  onChange,
  error,
  touched,
  disabled = false,
  required = false,
  className,
}: GuidanceFieldProps) {
  const loadOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getDirectivesPaginated({
        search: search.trim() || undefined,
        skip,
        limit,
      });
      const items = (response?.items ?? []).map((d: DirectiveApiResponse) => ({
        value: d?.id ?? '',
        label: d?.directive_text ?? '',
        description: d?.related_meeting ?? '',
      }));
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
    <div className={className}>
      <label className="block text-right text-[14px] font-medium text-[#344054] mb-1">
        التوجيه
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <p className="text-right text-[12px] text-[#64748B] mb-[6px]" aria-hidden>
        (لا تتم تعبئته آليًا في حال كان الاجتماع إلحاقي أو دوري)
      </p>
      <div className="w-full">
        <FormAsyncSelectV2
          value={value ?? null}
          onValueChange={onChange}
          loadOptions={loadOptions}
          placeholder="التوجيه"
          isSearchable
          isClearable
          isDisabled={disabled}
          error={!!(touched && error)}
          errorMessage={touched ? error ?? null : null}
          searchPlaceholder="البحث عن التوجيه..."
          emptyMessage="لم يتم العثور على نتائج."
          fullWidth
          limit={STEP1_ASYNC_SELECT_PAGE_SIZE}
        />
        {touched && error && (
          <p className="text-right text-[14px] text-[#D13C3C] mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}
