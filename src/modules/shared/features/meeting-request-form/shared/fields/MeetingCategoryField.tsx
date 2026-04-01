import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { getMeetingCategoryOptions } from "../types/enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { meetingType: string; disabled?: boolean; required?: boolean }

export function MeetingCategoryField({ meetingType, disabled, required = true }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_classification");
  const isDisabled = disabled || !editable;
  const options = getMeetingCategoryOptions(meetingType);

  return (
    <FormField label="فئة الاجتماع" name="meeting_classification" required={required} errors={errors} colSpan={4}>
      <Controller name="meeting_classification" control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
            <SelectTrigger className={inputClass(!!errors.meeting_classification)}><SelectValue placeholder="فئة الاجتماع" /></SelectTrigger>
            <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}
