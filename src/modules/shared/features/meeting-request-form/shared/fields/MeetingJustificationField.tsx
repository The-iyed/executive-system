import { useFormContext } from "react-hook-form";
import { Input } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function MeetingJustificationField({ disabled }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_justification");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="مبرر اللقاء" name="meeting_justification" required={required} errors={errors} colSpan={4}>
      <Input placeholder="مبرر اللقاء" disabled={isDisabled} className={inputClass(!!errors.meeting_justification)} {...register("meeting_justification")} />
    </FormField>
  );
}
