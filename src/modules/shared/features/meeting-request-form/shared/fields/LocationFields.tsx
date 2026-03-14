import { useFormContext, Controller } from "react-hook-form";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { MEETING_LOCATION_OPTIONS } from "../types/enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean; showCustom?: boolean }

export function LocationField({ disabled }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_location");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="الموقع" name="meeting_location" required errors={errors} colSpan={4}>
      <Controller name="meeting_location" control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
            <SelectTrigger className={inputClass(!!errors.meeting_location)}><SelectValue placeholder="اختر الموقع" /></SelectTrigger>
            <SelectContent>{MEETING_LOCATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}

export function LocationCustomField({ disabled }: { disabled?: boolean }) {
  const { register, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_location_custom");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="تحديد الموقع (موقع آخر)" name="meeting_location_custom" required errors={errors} colSpan={4}>
      <Input placeholder="أدخل الموقع" disabled={isDisabled} className={inputClass(!!errors.meeting_location_custom)} {...register("meeting_location_custom")} />
    </FormField>
  );
}