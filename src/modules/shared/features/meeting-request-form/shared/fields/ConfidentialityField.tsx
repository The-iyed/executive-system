import { useFormContext, Controller } from "react-hook-form";
import { Switch } from "@/lib/ui";
import { MeetingConfidentiality } from "../types/enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";
import { FormField } from "./FieldGroup";

interface Props {
  disabled?: boolean;
  required?: boolean;
}

export function ConfidentialityField({ disabled }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_confidentiality");
  const isDisabled = disabled || !editable;

  return (
    <FormField label="اجتماع سرّي؟" name="meeting_confidentiality" errors={errors} colSpan={4}>
      <div className="pt-1.5">
        <Controller
          name="meeting_confidentiality"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value === MeetingConfidentiality.CONFIDENTIAL}
              onCheckedChange={(c) =>
                field.onChange(c ? MeetingConfidentiality.CONFIDENTIAL : MeetingConfidentiality.NORMAL)
              }
              disabled={isDisabled}
            />
          )}
        />
      </div>
    </FormField>
  );
}