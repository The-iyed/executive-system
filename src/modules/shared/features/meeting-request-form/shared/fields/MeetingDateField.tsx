import { useFormContext, Controller } from "react-hook-form";
import { FormField } from "./FieldGroup";
import { DateTimePickerField } from "./DateTimePickerField";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props {
  label?: string;
  startName: string;
  endName: string;
  required?: boolean;
  minDate?: Date;
  hasError?: boolean;
  disabled?: boolean;
}

export function MeetingDateField({ label = "موعد الاجتماع المقترح", startName, endName, required, minDate, disabled }: Props) {
  const { control, setValue, watch, formState: { errors } } = useFormContext();
  const endValue = watch(endName);
  const startEditable = useIsFieldEditable(startName);
  const endEditable = useIsFieldEditable(endName);
  const isDisabled = disabled || (!startEditable && !endEditable);

  return (
    <FormField label={label} name={startName} required={required} errors={errors} colSpan={4}>
      <Controller name={startName} control={control}
        render={({ field }) => (
          <DateTimePickerField
            value={field.value}
            endValue={endValue}
            onChange={field.onChange}
            onChangeEnd={(v) => setValue(endName, v)}
            hasError={!!errors[startName]}
            minDate={minDate}
            disabled={isDisabled}
          />
        )}
      />
    </FormField>
  );
}
