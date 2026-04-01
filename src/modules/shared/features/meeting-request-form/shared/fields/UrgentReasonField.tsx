import { useFormContext } from "react-hook-form";
import { Input } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean; required?: boolean }

export function UrgentReasonField({ disabled, required = true }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("urgent_reason");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="مبرر الاستعجال" name="urgent_reason" required={required} errors={errors} colSpan={4}>
      <Input placeholder="مبرر الاستعجال" disabled={isDisabled} className={inputClass(!!errors.urgent_reason)} {...register("urgent_reason")} />
    </FormField>
  );
}