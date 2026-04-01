import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { MEETING_CLASSIFICATION_OPTIONS } from "../types/enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean; required?: boolean }

export function ClassificationTypeField({ disabled, required = true }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_classification_type");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="تصنيف الاجتماع" name="meeting_classification_type" required={required} errors={errors} colSpan={4}>
      <Controller name="meeting_classification_type" control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
            <SelectTrigger className={inputClass(!!errors.meeting_classification_type)}><SelectValue placeholder="اختر النوع" /></SelectTrigger>
            <SelectContent>{MEETING_CLASSIFICATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}
