import { useFormContext } from "react-hook-form";
import { Input } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function DescriptionField({ disabled }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("description");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="وصف الاجتماع" name="description" errors={errors} colSpan={4}>
      <Input placeholder="وصف الاجتماع" disabled={isDisabled} className={inputClass(!!errors.description)} {...register("description")} />
    </FormField>
  );
}
