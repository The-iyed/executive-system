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
  /** Where to store the selected user object in form state. Defaults to `${name}_user`. */
  userFieldName?: string;
}

export function MeetingManagerField({
  name,
  label,
  placeholder,
  disabled,
  required = true,
  initialLabel,
  userFieldName,
}: Props) {
  const { control, setValue, formState: { errors } } = useFormContext();
  const userKey = userFieldName ?? `${name}_user`;
  return (
    <FormField label={label} name={name} required={required} errors={errors} colSpan={4}>
      <Controller name={name} control={control}
        render={({ field }) => (
          <ManagerSelect
            value={field.value ?? ""}
            onChange={field.onChange}
            onSelectUser={(user) => setValue(userKey, user, { shouldDirty: true })}
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