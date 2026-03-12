import { useFormContext, Controller } from "react-hook-form";
import { FormField } from "./FieldGroup";
import { ManagerSelect } from "./ManagerSelect";

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  initialLabel?: string;
}

export function MeetingManagerField({ name, label, placeholder, disabled, required = true, initialLabel }: Props) {
  const { control, formState: { errors } } = useFormContext();
  return (
    <FormField label={label} name={name} required={required} errors={errors} colSpan={4}>
      <Controller name={name} control={control}
        render={({ field }) => (
          <ManagerSelect
            value={field.value ?? ""}
            onChange={field.onChange}
            placeholder={placeholder}
            hasError={!!errors[name]}
            disabled={disabled}
            initialLabel={initialLabel}
          />
        )}
      />
    </FormField>
  );
}
