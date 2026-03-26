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
    if (label && label !== value.value) return;
    resolvingRef.current = true;
    getMinisterDirective(value.value)
      .then((d: MinisterDirective) => {
        const resolvedLabel = d?.title || value.value;
        onChange({ value: value.value, label: resolvedLabel });
      })
      .catch(() => {})
      .finally(() => {
        resolvingRef.current = false;
      });
  }, [value?.value]);

  const loadOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const directives = await listMinisterDirectives({ skip, limit });
      const filtered = search.trim()
        ? directives.filter((d) => d.title?.includes(search.trim()))
        : directives;
      const items = filtered.map((d: MinisterDirective) => ({
        value: String(d.id),
        label: String(d.title || d.id),
      })).filter((o) => o.value);
      return {
        items,
        total: items.length,
        skip,
        limit,
        has_next: directives.length >= limit,
        has_previous: skip > 0,
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
