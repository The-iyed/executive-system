import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui";
import { FormField, inputClass } from "./FieldGroup";
import { MEETING_CHANNEL_OPTIONS } from "../../enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function MeetingChannelField({ disabled }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("meeting_channel");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="آلية انعقاد الاجتماع" name="meeting_channel" required errors={errors} colSpan={4}>
      <Controller name="meeting_channel" control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
            <SelectTrigger className={inputClass(!!errors.meeting_channel)}><SelectValue placeholder="حضوري / عن بعد" /></SelectTrigger>
            <SelectContent>{MEETING_CHANNEL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}