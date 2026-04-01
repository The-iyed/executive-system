import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { MEETING_TYPE_OPTIONS } from "../types/enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean; required?: boolean }

export function MeetingTypeField({ disabled, required = true }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_type");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="نوع الاجتماع" name="meeting_type" required={required} errors={errors} colSpan={4}>
      <Controller name="meeting_type" control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
            <SelectTrigger className={inputClass(!!errors.meeting_type)}><SelectValue placeholder="نوع الاجتماع" /></SelectTrigger>
            <SelectContent>{MEETING_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}
