import { useFormContext } from "react-hook-form";
import { Textarea } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function NoteField({ disabled }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("note");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="ملاحظات" name="note" errors={errors}>
      <Textarea placeholder="ملاحظات" disabled={isDisabled} className={inputClass(!!errors.note) + " min-h-[100px] resize-y"} {...register("note")} />
    </FormField>
  );
}
