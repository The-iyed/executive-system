import { useFormContext } from "react-hook-form";
import { Input } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function PreviousMeetingField({ disabled }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("previous_meeting_id");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="الاجتماع السابق" name="previous_meeting_id" required errors={errors} colSpan={4}>
      <Input placeholder="معرّف الاجتماع السابق" disabled={isDisabled} className={inputClass(!!errors.previous_meeting_id)} {...register("previous_meeting_id")} />
    </FormField>
  );
}
