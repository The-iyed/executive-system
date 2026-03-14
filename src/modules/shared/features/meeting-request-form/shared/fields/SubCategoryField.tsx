import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { MEETING_SUB_CATEGORY_OPTIONS } from "../types/enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function SubCategoryField({ disabled }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_sub_category");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="الفئة الفرعية" name="meeting_sub_category" errors={errors} colSpan={4}>
      <Controller name="meeting_sub_category" control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
            <SelectTrigger className={inputClass(!!errors.meeting_sub_category)}><SelectValue placeholder="اختر الفئة الفرعية" /></SelectTrigger>
            <SelectContent>{MEETING_SUB_CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}
