import { useCallback, useEffect, useRef } from 'react';
import { FormAsyncSelectV2 } from '@/modules/shared';
import type { OptionType } from '@/modules/shared';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../utils';
import { listMinisterDirectives, getMinisterDirective, type MinisterDirective } from '@/modules/guiding-light/api/minister-directives';

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
  const resolvingRef = useRef(false);

  useEffect(() => {
    if (!value?.value || resolvingRef.current) return;
    const label = value.label?.trim();
    if (label && label !== value.value) return; // already has real label
    resolvingRef.current = true;
    getDirectiveById(value.value)
      .then((d: DirectiveApiResponse) => {
        const resolvedLabel = [d?.directive_text, d?.directive_number, d?.id].find(Boolean) ?? value.value;
        onChange({ value: value.value, label: resolvedLabel, description: d?.related_meeting });
      })
      .catch(() => {})
      .finally(() => {
        resolvingRef.current = false;
      });
  }, [value?.value]); // only when id changes; avoid loop from onChange

  const loadOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getDirectivesPaginated({
        search: search.trim() || undefined,
        skip,
        limit,
      });
      const items = (response?.items ?? []).map((d: DirectiveApiResponse) => ({
        value: String(d?.id ?? ''),
        label: String(d?.title || d?.directive_text || ''),
        description: d?.related_meeting ?? '',
      })).filter((o) => o.value);
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
