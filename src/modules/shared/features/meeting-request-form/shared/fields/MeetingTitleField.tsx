import { useFormContext } from "react-hook-form";
import { Input } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function MeetingTitleField({ disabled }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_title");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="عنوان الاجتماع" name="meeting_title" required errors={errors} colSpan={4}>
      <Input placeholder="عنوان الاجتماع" disabled={isDisabled} className={inputClass(!!errors.meeting_title)} {...register("meeting_title")} />
    </FormField>
  );
}
