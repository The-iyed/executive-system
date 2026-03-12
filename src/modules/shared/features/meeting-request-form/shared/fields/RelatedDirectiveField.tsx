import { Controller, useFormContext } from "react-hook-form";
import { FormField } from "./FieldGroup";
import { DirectiveSelect } from "./DirectiveSelect";
import { useIsFieldEditable } from "../hooks";

interface Props { disabled?: boolean, defaultDirectiveLabel?:string }

export function RelatedDirectiveField({ disabled , defaultDirectiveLabel}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("related_directive");
  const isDisabled = disabled || !editable;
  const hasError = !!errors["related_directive"];

  return (
    <FormField label="التوجيه" name="related_directive" errors={errors}>
      <Controller
        name="related_directive"
        control={control}
        render={({ field }) => (
          <DirectiveSelect
            value={field.value || ""}
            onChange={field.onChange}
            placeholder="ابحث عن توجيه..."
            disabled={isDisabled}
            hasError={hasError}
            defaultLabel={defaultDirectiveLabel}
          />
        )}
      />
    </FormField>
  );
}
