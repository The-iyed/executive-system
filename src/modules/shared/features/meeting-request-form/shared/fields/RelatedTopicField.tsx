import { useFormContext } from "react-hook-form";
import { Input } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean; required?: boolean }

export function RelatedTopicField({ disabled, required = true }: Props) {
  const { register, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("related_topic");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="موضوع التكليف المرتبط" name="related_topic" required={required} errors={errors} colSpan={4}>
      <Input placeholder="أدخل الموضوع" disabled={isDisabled} className={inputClass(!!errors.related_topic)} {...register("related_topic")} />
    </FormField>
  );
}