import { FormAsyncSelectV2 } from '@shared';
import type { OptionType } from '@shared';
import { STEP1_ASYNC_SELECT_PAGE_SIZE } from '../../../../constants/step1.constants';

export interface GuidanceFieldProps {
  value: OptionType | null;
  onChange: (value: OptionType | null) => void;
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
  className?: string;
}

/**
 * Guidance (التوجيه). Async select to load all directives.
 * Does NOT auto-populate when Nature = Follow-up (إلحاقي) or Recurring (دوري).
 */
export function GuidanceField({
  value,
  onChange,
  loadOptions,
  error,
  touched,
  disabled = false,
  required = false,
  className,
}: GuidanceFieldProps) {
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
