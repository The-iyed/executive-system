import { useFormContext, Controller } from "react-hook-form";
import { FormField } from "./FieldGroup";
import { MeetingSelect } from "./MeetingSelect";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props {
  disabled?: boolean;
  /** Fallback display label for edit mode */
  initialLabel?: string;
}

export function PreviousMeetingField({ disabled, initialLabel }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("previous_meeting_id");
  const isDisabled = disabled || !editable;

  return (
    <FormField label="الاجتماع السابق" name="previous_meeting_id" required errors={errors} colSpan={4}>
      <Controller
        name="previous_meeting_id"
        control={control}
        render={({ field }) => (
          <MeetingSelect
            value={field.value ?? ""}
            onChange={field.onChange}
            placeholder="ابحث عن اجتماع سابق..."
            hasError={!!errors.previous_meeting_id}
            disabled={isDisabled}
            initialLabel={initialLabel}
          />
        )}
      />
    </FormField>
  );
}
