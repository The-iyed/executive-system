import { useFormContext, Controller } from "react-hook-form";
import { FormField } from "./FieldGroup";
import { ProposersSelect, type ProposerSelection } from "./ProposersSelect";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props {
  name?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Shared multi-select proposers field.
 * Uses the same AD user search as MeetingManagerField / ManagerSelect.
 * Displays checkboxes in the dropdown and compact chips for selections.
 */
export function ProposersField({
  name = "proposers",
  label = "المقترحون",
  description = "المستخدمون الذين يتلقون إشعاراً دون إضافتهم كمدعوين (اختياري).",
  disabled,
  required = false,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable(name);
  const isDisabled = disabled || !editable;

  return (
    <FormField label={label} name={name} required={required} errors={errors} colSpan={4} description={description}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <ProposersSelect
            value={(field.value as ProposerSelection[]) ?? []}
            onChange={field.onChange}
            disabled={isDisabled}
            hasError={!!errors[name]}
          />
        )}
      />
    </FormField>
  );
}
