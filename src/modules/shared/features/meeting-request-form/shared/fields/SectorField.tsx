import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { SECTOR_OPTIONS } from "../../enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean; required?: boolean }

export function SectorField({ disabled, required }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("sector");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="القطاع" name="sector" required={required} errors={errors} colSpan={4}>
      <Controller name="sector" control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
            <SelectTrigger className={inputClass(!!errors.sector)}><SelectValue placeholder="اختر القطاع" /></SelectTrigger>
            <SelectContent>{SECTOR_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}